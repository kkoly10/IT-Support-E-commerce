// File: app/api/process-document/route.js (new — create folder: mkdir -p app/api/process-document)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PROCESSING_PROMPTS = {
  invoice_extraction: `You are an invoice processing AI. Extract the following from this document:
- Vendor/Company name
- Invoice number
- Invoice date
- Due date
- Line items (description, quantity, unit price, total)
- Subtotal, tax, and total amount
- Payment terms

Return the data as structured JSON.`,

  form_processing: `You are a form processing AI. Extract all fields and their values from this document.
Return the data as structured JSON with field names as keys and their values.`,

  document_summary: `You are a document summarization AI. Provide:
- A concise summary (2-3 paragraphs)
- Key points (bullet list)
- Any action items or important dates mentioned
- Document type/category

Return as structured JSON.`,

  data_entry: `You are a data entry AI. Extract all structured data from this document that could be entered into a spreadsheet.
Return as JSON with:
- headers: array of column names
- rows: array of arrays with the data
- notes: any relevant context`,
}

export async function POST(request) {
  try {
    const { jobId } = await request.json()
    if (!jobId) {
      return Response.json({ error: 'Missing jobId' }, { status: 400 })
    }

    const { data: job, error: jobErr } = await supabase
      .from('document_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobErr || !job) {
      return Response.json({ error: 'Job not found' }, { status: 404 })
    }

    await supabase
      .from('document_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    const startTime = Date.now()

    const fileContents = []
    for (const filePath of job.input_files || []) {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from('document-jobs')
        .download(filePath)

      if (dlErr) {
        console.error('Download error:', dlErr)
        continue
      }

      const fileName = filePath.split('/').pop()
      const mimeType = fileData.type || 'application/octet-stream'

      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        const buffer = await fileData.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')

        if (mimeType === 'application/pdf') {
          fileContents.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 }
          })
        } else {
          fileContents.push({
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64 }
          })
        }
      } else {
        const text = await fileData.text()
        fileContents.push({
          type: 'text',
          text: `--- File: ${fileName} ---\n${text}`
        })
      }
    }

    if (fileContents.length === 0) {
      await supabase
        .from('document_jobs')
        .update({
          status: 'failed',
          error_message: 'No valid files could be processed',
        })
        .eq('id', jobId)

      return Response.json({ error: 'No valid files' }, { status: 400 })
    }

    const systemPrompt = PROCESSING_PROMPTS[job.job_type] || PROCESSING_PROMPTS.document_summary

    const messages = [
      {
        role: 'user',
        content: [
          ...fileContents,
          {
            type: 'text',
            text: job.description
              ? `Additional instructions: ${job.description}\n\nProcess this document now.`
              : 'Process this document now.'
          }
        ]
      }
    ]

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      throw new Error(`Anthropic API error: ${errText}`)
    }

    const aiResult = await anthropicResponse.json()
    const resultText = aiResult.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('\n')

    const processingTime = Date.now() - startTime

    const outputPath = `${job.organization_id}/results/${jobId}.json`
    const outputData = JSON.stringify({
      job_id: jobId,
      job_type: job.job_type,
      processed_at: new Date().toISOString(),
      processing_time_ms: processingTime,
      result: resultText,
    }, null, 2)

    await supabase.storage
      .from('document-jobs')
      .upload(outputPath, new Blob([outputData], { type: 'application/json' }))

    await supabase
      .from('document_jobs')
      .update({
        status: 'completed',
        output_files: [outputPath],
        ai_model_used: 'claude-sonnet-4-20250514',
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return Response.json({ success: true, jobId })

  } catch (err) {
    console.error('Processing error:', err)

    try {
      const { jobId } = await request.clone().json()
      if (jobId) {
        await supabase
          .from('document_jobs')
          .update({
            status: 'failed',
            error_message: err.message || 'Processing failed',
          })
          .eq('id', jobId)
      }
    } catch (e) {
      // ignore
    }

    return Response.json({ error: err.message || 'Processing failed' }, { status: 500 })
  }
}
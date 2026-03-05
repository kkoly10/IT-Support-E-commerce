// File: app/api/ai/assign-training/route.js (new — mkdir -p app/api/ai/assign-training)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { organizationId, courseId, dueDate, isRecurring, recurrenceMonths, isMandatory, title, message, assignedBy } = await request.json()

    if (!organizationId || !courseId || !dueDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the assignment
    const { data: assignment, error: assignErr } = await supabase
      .from('training_assignments')
      .insert({
        organization_id: organizationId,
        course_id: courseId,
        assigned_by: assignedBy,
        due_date: dueDate,
        is_recurring: isRecurring || false,
        recurrence_months: recurrenceMonths || 1,
        is_mandatory: isMandatory !== false,
        title,
        message,
      })
      .select()
      .single()

    if (assignErr) throw assignErr

    // Get all users in the organization
    const { data: members } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)

    // Create status records for each member
    if (members && members.length > 0) {
      const statusRecords = members.map(member => ({
        assignment_id: assignment.id,
        user_id: member.id,
        organization_id: organizationId,
        status: 'pending',
      }))

      await supabase
        .from('training_assignment_status')
        .insert(statusRecords)
    }

    // Log the assignment
    await supabase.from('activity_log').insert({
      organization_id: organizationId,
      actor_id: assignedBy,
      action: 'training_assigned',
      resource_type: 'training_assignment',
      resource_id: assignment.id,
      metadata: {
        course_id: courseId,
        due_date: dueDate,
        member_count: members?.length || 0,
        is_mandatory: isMandatory,
      },
    })

    return Response.json({
      success: true,
      assignment,
      members_assigned: members?.length || 0,
    })

  } catch (err) {
    console.error('Assign training error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
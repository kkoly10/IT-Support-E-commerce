// File: lib/oauth/platforms.js (new — mkdir -p lib/oauth)

export const PLATFORMS = {
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    color: '#96BF48',
    description: 'Connect your Shopify store to monitor orders, products, and inventory.',
    scopes: 'read_products,read_orders,read_inventory,read_analytics,read_customers',
    needsShopDomain: true,
    getAuthUrl: (shopDomain, clientId, redirectUri, state) => {
      return `https://${shopDomain}/admin/oauth/authorize?client_id=${clientId}&scope=read_products,read_orders,read_inventory,read_analytics,read_customers&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    },
    tokenUrl: (shopDomain) => `https://${shopDomain}/admin/oauth/access_token`,
  },

  wix: {
    name: 'Wix',
    icon: '🌐',
    color: '#0C6EFC',
    description: 'Connect your Wix site to monitor performance and manage content.',
    needsShopDomain: false,
    getAuthUrl: (_, clientId, redirectUri, state) => {
      return `https://www.wix.com/installer/install?appId=${clientId}&redirectUrl=${encodeURIComponent(redirectUri)}&state=${state}`
    },
    tokenUrl: () => 'https://www.wixapis.com/oauth/access',
  },

  woocommerce: {
    name: 'WooCommerce',
    icon: '🟣',
    color: '#96588A',
    description: 'Connect your WooCommerce store for order and product monitoring.',
    needsShopDomain: true,
    getAuthUrl: (shopDomain, clientId, redirectUri, state) => {
      const callbackUrl = encodeURIComponent(redirectUri)
      return `https://${shopDomain}/wc-auth/v1/authorize?app_name=TechDesk+Pro&scope=read&user_id=${state}&return_url=${callbackUrl}&callback_url=${callbackUrl}`
    },
  },

  google_workspace: {
    name: 'Google Workspace',
    icon: '📧',
    color: '#4285F4',
    description: 'Connect Google Workspace to monitor email, calendar, and admin health.',
    needsShopDomain: false,
    getAuthUrl: (_, clientId, redirectUri, state) => {
      const scopes = encodeURIComponent('https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/gmail.readonly')
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${state}&access_type=offline&prompt=consent`
    },
    tokenUrl: () => 'https://oauth2.googleapis.com/token',
  },

  squarespace: {
    name: 'Squarespace',
    icon: '◼️',
    color: '#000000',
    description: 'Connect your Squarespace site to monitor performance and content.',
    needsShopDomain: false,
    getAuthUrl: (_, clientId, redirectUri, state) => {
      return `https://login.squarespace.com/api/1/login/oauth/provider/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=website.orders.read,website.products.read,website.inventory.read&state=${state}&access_type=offline`
    },
    tokenUrl: () => 'https://login.squarespace.com/api/1/login/oauth/provider/tokens',
  },
}

export function getPlatformConfig(platform) {
  return PLATFORMS[platform] || null
}

export function getEnvKeys(platform) {
  const prefix = platform.toUpperCase().replace(/-/g, '_')
  return {
    clientId: process.env[`${prefix}_CLIENT_ID`],
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`],
  }
}
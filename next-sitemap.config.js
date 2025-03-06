/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://timesheet.yourcompany.com',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/dashboard/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api', '/dashboard/api'],
      },
    ],
  },
}; 
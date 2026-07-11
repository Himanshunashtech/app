import type { AppConnectorDefinition, ConnectorCategory } from './types';

const CATEGORY_APPS: Record<ConnectorCategory, readonly string[]> = {
  social: [
    'Facebook','Instagram','Threads','X','LinkedIn','TikTok','YouTube','Reddit','Pinterest','Snapchat','Tumblr','Mastodon','Bluesky','Discord Community','Twitch','Medium','Substack','Quora','Nextdoor','Flickr','Vimeo','Dribbble','Behance','Product Hunt','Hacker News','GitHub Discussions','Stack Overflow','Goodreads','Letterboxd','SoundCloud','Clubhouse','Farcaster'
  ],
  messaging: [
    'WhatsApp','Telegram','Signal','Messenger','Slack','Microsoft Teams','Discord','WeChat','LINE','Viber','KakaoTalk','Skype','Google Chat','Zoom Team Chat','Mattermost','Rocket.Chat','Twilio SMS','Twilio WhatsApp','SendGrid Email','Mailgun Email','Postmark Email','Intercom Inbox','Zendesk Messaging','Front','Help Scout','Freshchat','Crisp','LiveChat','Drift','Gorgias','Aircall','RingCentral'
  ],
  productivity: [
    'Google Workspace','Gmail','Google Docs','Google Sheets','Google Slides','Google Forms','Microsoft 365','Outlook','Word Online','Excel Online','PowerPoint Online','Notion','Airtable','Coda','ClickUp','Asana','Monday.com','Trello','Todoist','Linear','Jira','Confluence','Basecamp','Smartsheet','Wrike','Miro','Figma','FigJam','Canva','Evernote','Obsidian','Roam Research'
  ],
  commerce: [
    'Shopify','WooCommerce','BigCommerce','Magento','Squarespace Commerce','Wix Stores','Etsy','Amazon Seller Central','eBay','Walmart Marketplace','TikTok Shop','Meta Commerce','Stripe Commerce','Square Online','Lightspeed','Toast','Clover','Faire','ShipStation','Shippo','EasyPost','AfterShip','Klaviyo Commerce','Recharge','Printful','Printify','Gelato','ShipBob','Flexport','Cin7','NetSuite Commerce','Odoo Sales'
  ],
  developer: [
    'GitHub','GitLab','Bitbucket','Azure DevOps','Vercel','Netlify','Cloudflare','AWS','Google Cloud','Azure','DigitalOcean','Render','Railway','Fly.io','Heroku','Sentry','Datadog','New Relic','Grafana Cloud','PagerDuty','Opsgenie','CircleCI','GitHub Actions','Buildkite','Jenkins','Docker Hub','Kubernetes','Terraform Cloud','Postman','LaunchDarkly','Supabase','Firebase'
  ],
  crm: [
    'Salesforce','HubSpot','Pipedrive','Zoho CRM','Freshsales','Close','Copper','Insightly','Keap','ActiveCampaign CRM','Attio','Folk','Airtable CRM','Nimble','Less Annoying CRM','Zendesk Sell','Microsoft Dynamics 365','Oracle CX','SAP Sales Cloud','SugarCRM','Capsule','Streak','Apollo','Outreach','Salesloft','Gong','Chorus','Clay','Clearbit','People Data Labs','Hunter','Lusha'
  ],
  storage: [
    'Google Drive','Dropbox','OneDrive','Box','iCloud Drive','Amazon S3','Google Cloud Storage','Azure Blob Storage','Backblaze B2','Cloudflare R2','Wasabi','MinIO','SharePoint','Egnyte','Mega','pCloud','Nextcloud','ownCloud','DocuSign CLM','Adobe Acrobat Sign','PandaDoc','Dropbox Sign','Notarize','DocSend','OneSpan Sign','SignNow','Nitro Sign','Filevine','Clio Drive','OpenText','M-Files','Zoho WorkDrive'
  ],
  calendar: [
    'Google Calendar','Outlook Calendar','Apple Calendar','Calendly','Cal.com','Acuity Scheduling','SavvyCal','Cron Calendar','Reclaim.ai','Motion','Clockwise','Doodle','YouCanBookMe','OnceHub','SimplyBook.me','Setmore','Appointlet','Book Like A Boss','Square Appointments','Vagaro','Mindbody','Jane App','Zocdoc','OpenTable','Resy','Tock','Eventbrite','Luma','Meetup','Zoom Scheduler','Teams Bookings','HubSpot Meetings'
  ],
  payments: [
    'Stripe','PayPal','Square','Adyen','Braintree','Checkout.com','Mollie','Razorpay','Paystack','Flutterwave','Wise','Plaid','Modern Treasury','Dwolla','GoCardless','Chargebee','Recurly','Paddle','Lemon Squeezy','FastSpring','Zuora','QuickBooks Payments','Xero Payments','Bill.com','Melio','Ramp','Brex','Airwallex','Mercury','Cash App Pay','Venmo Business','Apple Pay'
  ],
  marketing: [
    'Mailchimp','ConvertKit','Customer.io','Braze','Iterable','HubSpot Marketing','Marketo','Pardot','Klaviyo','ActiveCampaign','Constant Contact','Campaign Monitor','Sendinblue','Drip','Omnisend','Ortto','Segment','RudderStack','Amplitude','Mixpanel','PostHog','Google Analytics','Google Ads','Meta Ads','TikTok Ads','LinkedIn Ads','Reddit Ads','Pinterest Ads','Snap Ads','Hootsuite','Buffer','Sprout Social'
  ],
};

const WRITE_ACTIONS = new Set(['send_message', 'publish_post', 'create_task', 'update_record']);

export function buildConnectorCatalog(): AppConnectorDefinition[] {
  return Object.entries(CATEGORY_APPS).flatMap(([category, names]) =>
    names.map((name) => buildDefinition(category as ConnectorCategory, name)),
  );
}

export function findConnector(connectorId: string): AppConnectorDefinition | undefined {
  return CONNECTOR_CATALOG.find((connector) => connector.id === connectorId);
}

function buildDefinition(category: ConnectorCategory, name: string): AppConnectorDefinition {
  const id = toConnectorId(name);
  const writable = category === 'messaging' || category === 'social' || category === 'productivity' || category === 'crm' || category === 'marketing';
  const actions = writable ? ['read', 'search', 'draft', category === 'social' ? 'publish_post' : 'send_message'] : ['read', 'search'];

  return {
    id,
    name,
    category,
    authModes: authModesFor(category),
    actions: actions as AppConnectorDefinition['actions'],
    risk: actions.some((action) => WRITE_ACTIONS.has(action)) ? 'external_write' : 'read_only',
    mcpServerName: `nexus-${id}`,
    officialApiBaseUrl: undefined,
    requiredScopes: scopesFor(category, writable),
    enabledByDefault: false,
  };
}

function authModesFor(category: ConnectorCategory): AppConnectorDefinition['authModes'] {
  if (category === 'developer' || category === 'storage') return ['oauth2_pkce', 'api_key'];
  if (category === 'payments') return ['oauth2_pkce', 'oauth2_client_credentials', 'webhook_signature'];
  return ['oauth2_pkce'];
}

function scopesFor(category: ConnectorCategory, writable: boolean): string[] {
  const scopes = [`${category}:read`];
  if (writable) scopes.push(`${category}:write`);
  return scopes;
}

function toConnectorId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export const CONNECTOR_CATALOG = Object.freeze(buildConnectorCatalog());
export const CONNECTOR_COUNT = CONNECTOR_CATALOG.length;

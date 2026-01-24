import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '@react-email/components'

import ChangeEmailEmail from '../templates/change-email'
import ConfirmationEmail from '../templates/confirmation'
import InviteEmail from '../templates/invite'
import MagicLinkEmail from '../templates/magic-link'
import ResetPasswordEmail from '../templates/reset-password'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '..', 'output')

const templates = [
  { name: 'confirmation', component: ConfirmationEmail },
  { name: 'magic-link', component: MagicLinkEmail },
  { name: 'reset-password', component: ResetPasswordEmail },
  { name: 'change-email', component: ChangeEmailEmail },
  { name: 'invite', component: InviteEmail },
]

async function build() {
  mkdirSync(outputDir, { recursive: true })

  console.log('Building email templates...\n')

  for (const template of templates) {
    const html = await render(template.component())
    const outputPath = join(outputDir, `${template.name}.html`)
    writeFileSync(outputPath, html, 'utf-8')
    console.log(`  ✓ ${template.name}.html`)
  }

  console.log(`\nDone! ${templates.length} templates generated in output/`)
  console.log('\nNext steps:')
  console.log('1. Copy the HTML from each file')
  console.log('2. Paste into Supabase Dashboard → Authentication → Email Templates')
  console.log('3. Test with a real email to verify rendering')
}

build().catch(console.error)

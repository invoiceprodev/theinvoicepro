import type { ContractFormInput } from "./types.js";

const DISCLAIMER = "This AI-generated contract should be reviewed by a qualified legal professional before official use.";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getContractDisclaimer() {
  return DISCLAIMER;
}

export function buildContractPrompt(input: ContractFormInput, parsedText?: string | null) {
  return `
You are drafting a professional business contract for an invoicing SaaS user.

Output requirements:
- Return valid HTML only
- Use semantic tags such as h1, h2, p, ul, li
- Make the structure clear and professional
- Include sensible section headings and standard contract-style clauses
- Use concise, professional legal-style language
- Do not invent laws, statutes, or compliance claims
- Do not provide legal guarantees
- Add a final footer paragraph with this exact disclaimer:
  "${DISCLAIMER}"

Business context:
- Company Name: ${input.companyName}
- Client Name: ${input.clientName}
- Contract Type: ${input.contractType}
- Services Description: ${input.servicesDescription}
- Payment Terms: ${input.paymentTerms}
- Contract Duration: ${input.contractDuration}
- Jurisdiction: ${input.jurisdiction}
- Additional Notes: ${input.additionalNotes || "None provided"}

Supporting document context:
${parsedText ? parsedText.slice(0, 12000) : "No supporting document text was provided."}

HTML structure expectations:
- Title heading with contract type
- Introductory parties paragraph
- Scope of services
- Payment terms
- Duration and termination
- Confidentiality if contextually appropriate
- Governing law / jurisdiction
- Signature acknowledgement section
- Disclaimer footer
`.trim();
}

export function buildContractHtmlFallback(input: ContractFormInput) {
  return `
<article class="contract-document">
  <h1>${escapeHtml(input.contractType || "Service Contract")}</h1>
  <p>This agreement is made between <strong>${escapeHtml(input.companyName)}</strong> and <strong>${escapeHtml(input.clientName)}</strong>.</p>
  <h2>1. Services</h2>
  <p>${escapeHtml(input.servicesDescription)}</p>
  <h2>2. Payment Terms</h2>
  <p>${escapeHtml(input.paymentTerms)}</p>
  <h2>3. Duration</h2>
  <p>${escapeHtml(input.contractDuration)}</p>
  <h2>4. Jurisdiction</h2>
  <p>This agreement is intended to be governed in accordance with the laws and courts applicable in ${escapeHtml(input.jurisdiction)}.</p>
  <h2>5. Additional Notes</h2>
  <p>${escapeHtml(input.additionalNotes || "No additional notes provided.")}</p>
  <h2>6. Review</h2>
  <p>Both parties should review this draft carefully and confirm that its contents match their intended commercial arrangement.</p>
  <footer>
    <p><em>${escapeHtml(DISCLAIMER)}</em></p>
  </footer>
</article>
`.trim();
}

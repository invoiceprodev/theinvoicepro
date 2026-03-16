export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  accentClass: string;
  coverImageUrl?: string;
  coverAttribution?: {
    label: string;
    url: string;
  };
  author: {
    name: string;
    role: string;
  };
  body: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-small-businesses-can-speed-up-invoice-payments",
    title: "How Small Businesses Can Speed Up Invoice Payments",
    description:
      "A practical guide to shortening payment cycles with clearer invoices, reminders, and better client communication.",
    category: "Cash Flow",
    readTime: "6 min read",
    publishedAt: "2026-03-16",
    accentClass: "from-emerald-500/25 via-teal-500/10 to-background",
    coverImageUrl:
      "https://images.pexels.com/photos/5083405/pexels-photo-5083405.jpeg?cs=srgb&dl=pexels-cottonbro-5083405.jpg&fm=jpg",
    coverAttribution: {
      label: "Photo by cottonbro studio from Pexels",
      url: "https://www.pexels.com/photo/browsing-pexels-on-an-imac-5083405/",
    },
    author: {
      name: "The Invoice Pro Editorial Team",
      role: "Operations & Billing",
    },
    body: [
      {
        heading: "Start with a cleaner invoice",
        paragraphs: [
          "Late payment problems often start before the invoice is even sent. If the document is hard to read, missing reference details, or unclear on terms, clients are more likely to delay approval.",
          "A professional invoice should include the due date, payment method, billing contact, reference number, and a short summary of what was delivered. The easier it is to understand, the faster it can move through the client approval chain.",
        ],
      },
      {
        heading: "Send invoices closer to the work",
        paragraphs: [
          "One of the simplest ways to improve cash flow is to reduce the lag between completing work and sending the invoice.",
          "If your team waits until the end of the week or month to batch everything together, you create an unnecessary delay. Sending invoices promptly keeps the job fresh in the client’s mind and starts the payment clock earlier.",
        ],
      },
      {
        heading: "Use reminders as part of the process",
        paragraphs: [
          "Reminder messages should not feel confrontational. They should feel operational. A well-timed reminder before and after the due date helps keep the invoice visible without creating friction.",
          "The key is consistency. If reminders happen every time, clients start to treat them as part of the normal billing rhythm rather than a sign that something is wrong.",
        ],
      },
      {
        heading: "Make payment options obvious",
        paragraphs: [
          "Even clients who intend to pay on time can stall if they need to ask how to pay or who to contact.",
          "Make the next step obvious. Include the preferred payment route clearly and remove any uncertainty around references, billing contacts, or follow-up questions.",
        ],
      },
    ],
  },
  {
    slug: "what-to-include-on-a-professional-invoice",
    title: "What To Include on a Professional Invoice",
    description:
      "The essential fields and formatting choices that make invoices easier to approve and pay.",
    category: "Invoicing",
    readTime: "5 min read",
    publishedAt: "2026-03-16",
    accentClass: "from-sky-500/25 via-cyan-500/10 to-background",
    coverImageUrl:
      "https://images.pexels.com/photos/7680692/pexels-photo-7680692.jpeg?cs=srgb&dl=pexels-karola-g-7680692.jpg&fm=jpg",
    coverAttribution: {
      label: "Photo by www.kaboompics.com from Pexels",
      url: "https://www.pexels.com/photo/close-up-shot-of-a-person-holding-a-calculator-7680692/",
    },
    author: {
      name: "The Invoice Pro Editorial Team",
      role: "Invoicing Systems",
    },
    body: [
      {
        heading: "Include the basics every time",
        paragraphs: [
          "A professional invoice should always include the invoice number, issue date, due date, client details, supplier details, line items, subtotal, tax where relevant, and total amount due.",
          "These are not just accounting details. They are the fields clients rely on to route the invoice internally and confirm that it can be paid.",
        ],
      },
      {
        heading: "Write line items so they can be approved quickly",
        paragraphs: [
          "A vague invoice slows everything down. Instead of broad labels like 'services rendered,' describe the work in a way that connects clearly to the project, retainer, or deliverable.",
          "Good line items reduce clarification requests and make the invoice easier to sign off.",
        ],
      },
      {
        heading: "State your payment terms clearly",
        paragraphs: [
          "Don’t assume the client remembers your terms from the proposal or contract. Put the due date and payment expectations directly on the invoice.",
          "Clear terms make follow-up easier later because both sides are working from the same visible record.",
        ],
      },
      {
        heading: "Keep the layout clean",
        paragraphs: [
          "Professional does not mean over-designed. What matters most is readability, hierarchy, and consistency.",
          "Use spacing, headings, and totals in a way that allows a client or finance contact to understand the invoice at a glance.",
        ],
      },
    ],
  },
  {
    slug: "choosing-the-right-billing-workflow-for-recurring-clients",
    title: "Choosing the Right Billing Workflow for Recurring Clients",
    description:
      "When to use recurring billing, scheduled renewals, and plan-based subscription management.",
    category: "Subscriptions",
    readTime: "7 min read",
    publishedAt: "2026-03-16",
    accentClass: "from-amber-500/25 via-orange-500/10 to-background",
    coverImageUrl:
      "https://images.pexels.com/photos/7552577/pexels-photo-7552577.jpeg?cs=srgb&dl=pexels-hanna-pad-7552577.jpg&fm=jpg",
    coverAttribution: {
      label: "Photo by Hanna Pad from Pexels",
      url: "https://www.pexels.com/photo/a-woman-holding-cardboard-boxes-7552577/",
    },
    author: {
      name: "The Invoice Pro Editorial Team",
      role: "Recurring Revenue Operations",
    },
    body: [
      {
        heading: "Not every recurring client needs the same billing model",
        paragraphs: [
          "Some clients are best billed through a simple monthly invoice. Others are a better fit for subscription-style billing with an agreed plan and renewal cycle.",
          "The right model depends on how standardized the work is, how often the amount changes, and how much administrative overhead your team can support.",
        ],
      },
      {
        heading: "Use recurring billing when the service is predictable",
        paragraphs: [
          "If the client receives the same service at the same price each cycle, recurring billing usually creates the cleanest operational setup.",
          "It reduces manual invoicing, lowers the risk of missed renewals, and makes revenue forecasting easier.",
        ],
      },
      {
        heading: "Keep some clients on managed renewals",
        paragraphs: [
          "When scope changes often or pricing is flexible, a more hands-on renewal workflow may still be the better option.",
          "That gives your team room to update pricing, confirm deliverables, and avoid confusion before the next cycle starts.",
        ],
      },
      {
        heading: "Choose the workflow your team can operate consistently",
        paragraphs: [
          "The best billing model is not the most advanced one. It is the one your team can run reliably with the least friction.",
          "If a process depends on too many reminders, manual checks, or exceptions, it becomes fragile. Strong billing operations come from repeatable systems.",
        ],
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) || null;
}

export function getRelatedBlogPosts(slug: string) {
  return blogPosts.filter((post) => post.slug !== slug).slice(0, 2);
}

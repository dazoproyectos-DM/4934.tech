import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const MAX_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_RE = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;
const HEADER_INJECTION_RE = /[\r\n]/;

function isCleanString(value: unknown, maxLength: number): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= maxLength && !HEADER_INJECTION_RE.test(value);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { email, firstName, lastName, company, message } = body as Record<string, unknown>;

        if (
            !isCleanString(email, MAX_LENGTH) ||
            !EMAIL_RE.test(email) ||
            !isCleanString(firstName, MAX_LENGTH) ||
            !isCleanString(lastName, MAX_LENGTH) ||
            !isCleanString(company, MAX_LENGTH) ||
            !isCleanString(message, MAX_MESSAGE_LENGTH)
        ) {
            return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 });
        }

        const mailgunDomain = process.env.MAILGUN_DOMAIN || '';
        const mailgunApiKey = process.env.MAILGUN_API_KEY || '';
        const recipientEmails = process.env.RECIPIENT_EMAILS || '';
        const mailgunSender = process.env.MAILGUN_SENDER_EMAIL || '';

        const from = `Contact 4934 <${mailgunSender}>`;
        const subject = `${firstName} ${lastName} at ${company}, ${email} - 4934 Contact Form Submission`;
        const bodyText = `${message}\n\nThis message was sent from the contact form on 4934.tech in accordance with the privacy policy (https://4934.tech/policies/privacy).`;

        const formData = new FormData();
        formData.append('from', from);
        formData.append('to', recipientEmails);
        formData.append('cc', email);
        formData.append('subject', subject);
        formData.append('text', bodyText);
        formData.append('h:Reply-To', email);

        const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mailgun Error:', errorText);
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Mailgun API returned status ${response.status}`);
        }

        return NextResponse.json({ status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

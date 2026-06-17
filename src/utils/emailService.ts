import emailjs from '@emailjs/browser';

export const sendRegistrationEmail = async (
  email: string,
  templateSubject: string,
  templateBodyHtml: string,
  replacements: Record<string, string>
) => {
  try {
    // Replace placeholders like {{Ten_Khach_Hang}}
    let processedHtml = templateBodyHtml;
    let processedSubject = templateSubject;

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedHtml = processedHtml.replace(regex, value);
      processedSubject = processedSubject.replace(regex, value);
    });

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS credentials not configured in .env");
      return false;
    }

    // EmailJS requires a generic template mapped to their dashboard
    // In EmailJS dashboard, create a template with variables:
    // to_email, subject, html_message
    const templateParams = {
      to_email: email,
      subject: processedSubject,
      html_message: processedHtml,
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log("Email sent successfully", response.status, response.text);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};

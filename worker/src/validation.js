// Server-side validation mirroring the site's form rules.
// Source of truth: docs/API-CONTRACT.md §2.6 (extracted from the JSX forms,
// which today rely on HTML `required` attributes + input types only).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

export function isDateString(v) {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function checkString(errors, fields, name, { required = false, max = 10000 } = {}) {
  const v = fields?.[name];
  if (v === undefined || v === null || v === '') {
    if (required) errors.push(`${name} is required`);
    return;
  }
  if (typeof v !== 'string') {
    errors.push(`${name} must be a string`);
    return;
  }
  if (v.length > max) errors.push(`${name} exceeds ${max} characters`);
}

function checkEmail(errors, fields, name, { required = false } = {}) {
  const v = fields?.[name];
  if (v === undefined || v === null || v === '') {
    if (required) errors.push(`${name} is required`);
    return;
  }
  if (!isEmail(v)) errors.push(`${name} must be a valid email address`);
}

function checkDate(errors, fields, name, { required = false } = {}) {
  const v = fields?.[name];
  if (v === undefined || v === null || v === '') {
    if (required) errors.push(`${name} is required`);
    return;
  }
  if (!isDateString(v)) errors.push(`${name} must be a YYYY-MM-DD date`);
}

function checkEnum(errors, fields, name, values, { required = false } = {}) {
  const v = fields?.[name];
  if (v === undefined || v === null || v === '') {
    if (required) errors.push(`${name} is required`);
    return;
  }
  if (!values.includes(v)) errors.push(`${name} must be one of: ${values.join(', ')}`);
}

const SHORT = 500; // single-line fields

export function validateSubmissionFields(kind, fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return ['fields must be an object'];
  }
  const errors = [];
  switch (kind) {
    case 'apply':
      checkString(errors, fields, 'fullName', { required: true, max: SHORT });
      checkDate(errors, fields, 'dateOfBirth', { required: true });
      checkEmail(errors, fields, 'email', { required: true });
      checkString(errors, fields, 'phone', { required: true, max: SHORT });
      checkEnum(errors, fields, 'applicationType', ['resident', 'family', 'referral'], { required: true });
      checkDate(errors, fields, 'sobrietyDate');
      // Form-declared cap: maxLength={600} in Apply.jsx
      checkString(errors, fields, 'substanceHistory', { required: true, max: 600 });
      checkString(errors, fields, 'previousTreatment', { required: true });
      checkString(errors, fields, 'currentSupport', { max: SHORT });
      checkString(errors, fields, 'reasonForHousing', { required: true });
      checkEnum(errors, fields, 'housingPreference', ['private', 'shared', 'any']);
      checkDate(errors, fields, 'moveInDate');
      checkEnum(errors, fields, 'employment', ['employed', 'parttime', 'seeking', 'unemployed', 'disabled'], { required: true });
      checkString(errors, fields, 'emergencyContact', { required: true, max: SHORT });
      checkString(errors, fields, 'emergencyPhone', { required: true, max: SHORT });
      checkString(errors, fields, 'additionalInfo');
      break;
    case 'investor':
      checkString(errors, fields, 'fullName', { required: true, max: SHORT });
      checkEmail(errors, fields, 'email', { required: true });
      checkString(errors, fields, 'phone', { required: true, max: SHORT });
      checkString(errors, fields, 'company', { max: SHORT });
      checkEnum(errors, fields, 'investorType', [
        'PMI - Private Money Investor',
        'PML - Private Money Lender',
        'PMP - Private Money Partner',
        'Mission-Based Investor',
        'Mission-Based Lender',
        'Other',
      ], { required: true });
      checkEnum(errors, fields, 'capitalRange', [
        'Under $25,000',
        '$25,000 - $50,000',
        '$50,000 - $100,000',
        '$100,000 - $250,000',
        '$250,000+',
      ], { required: true });
      checkDate(errors, fields, 'preferredDate', { required: true });
      checkEnum(errors, fields, 'preferredTime', [
        'Morning (9am - 12pm)',
        'Afternoon (12pm - 3pm)',
        'Late Afternoon (3pm - 5pm)',
        'Evening (5pm - 7pm)',
      ], { required: true });
      checkString(errors, fields, 'message');
      break;
    case 'contact':
      checkString(errors, fields, 'name', { required: true, max: SHORT });
      checkEmail(errors, fields, 'email', { required: true });
      checkString(errors, fields, 'phone', { max: SHORT });
      checkEnum(errors, fields, 'inquiryType', ['housing', 'family', 'referral', 'employment', 'other'], { required: true });
      checkString(errors, fields, 'message', { required: true });
      break;
    case 'feedback':
      checkString(errors, fields, 'name', { required: true, max: SHORT });
      checkEmail(errors, fields, 'email', { required: true });
      checkEnum(errors, fields, 'feedbackType', [
        'Bug Report',
        'Suggestion',
        'Complaint',
        'Accessibility Issue',
        'Content Error',
        'Other',
      ], { required: true });
      checkString(errors, fields, 'message', { required: true });
      break;
    default:
      errors.push(`unknown submission kind: ${kind}`);
  }
  return errors;
}

// Envelope for the composed-email submissions (API-CONTRACT.md §2.5).
export function validateEnvelope(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return ['JSON object body required'];
  for (const key of ['to', 'subject', 'body']) {
    if (typeof payload[key] !== 'string' || payload[key].length === 0) {
      errors.push(`${key} is required`);
    }
  }
  if (typeof payload.subject === 'string' && payload.subject.length > 500) {
    errors.push('subject exceeds 500 characters');
  }
  if (typeof payload.body === 'string' && payload.body.length > 50000) {
    errors.push('body exceeds 50000 characters');
  }
  return errors;
}

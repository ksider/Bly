const fallbackSample = {
  meta: {
    eventName: 'Fallback Expo',
    eventDate: '2025-08-01',
    eventLocation: 'Online',
    eventLogo: '',
    sponsorLogo: ''
  },
  participants: [
    {
      id: 'p-001',
      firstName: 'Avery',
      lastName: 'Lin',
      displayName: 'Avery Lin',
      role: 'Designer',
      company: 'Northwind',
      email: 'avery@example.com',
      badgeType: 'VIP',
      qrValue: 'https://example.com/avery'
    },
    {
      id: 'p-002',
      firstName: 'Jordan',
      lastName: 'Smith',
      displayName: 'Jordan Smith',
      role: 'Engineer',
      company: 'Contoso',
      email: 'jordan@example.com',
      badgeType: 'Standard',
      qrValue: 'https://example.com/jordan'
    }
  ]
};

export async function fetchSampleData() {
  try {
    const res = await fetch('/example/sample.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    return { ...fallbackSample };
  }
}

export function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

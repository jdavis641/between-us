const fs = require('fs');

let code = fs.readFileSync('app/login/page.tsx', 'utf8');

const replacement = `  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return
    setLoading(true)
    setAuthMessage('Verifying code...')

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage(data.error || 'Verification failed');
        setLoading(false);
      } else {
        window.location.href = data.destination;
      }
    } catch (err: any) {
      setAuthMessage('Network error: ' + err.message);
      setLoading(false);
    }
  }`;

code = code.replace(/  const handleVerifyOtp = async \(\) => \{[\s\S]*?setLoading\(false\)\n    \}\n  \}/, replacement);

fs.writeFileSync('app/login/page.tsx', code);

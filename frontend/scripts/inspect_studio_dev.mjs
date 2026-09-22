async function inspectStudio() {
  try {
    const res = await fetch('https://studio-dev.genlayer.com/');
    const html = await res.text();
    console.log('HTML length:', html.length);
    const scriptMatches = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    console.log('Found scripts:', scriptMatches);

    for (const s of scriptMatches) {
      const url = s.startsWith('http') ? s : 'https://studio-dev.genlayer.com' + (s.startsWith('/') ? '' : '/') + s;
      console.log('Checking script:', url);
      const sRes = await fetch(url);
      const text = await sRes.text();
      const dependsMatches = [...text.matchAll(/Depends["']?:\s*["']([^"']+)["']/g)].map(m => m[1]);
      if (dependsMatches.length > 0) {
        console.log('Found Depends in', url, dependsMatches);
      }
      const pyGenMatches = [...text.matchAll(/py-genlayer:[a-zA-Z0-9_-]+/g)].map(m => m[0]);
      if (pyGenMatches.length > 0) {
        console.log('Found py-genlayer in', url, pyGenMatches);
      }
    }
  } catch (err) {
    console.error('Error inspecting studio:', err);
  }
}

inspectStudio();

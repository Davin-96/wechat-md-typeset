async function uploadImage(buffer, filename, settings) {
  const provider = settings.imageHost || 'catbox';

  if (provider === 'catbox') {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), filename);
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    const url = (await res.text()).trim();
    if (!/^https?:\/\//.test(url)) throw new Error('catbox 上传失败: ' + url);
    return url;
  }

  if (provider === 'smms') {
    const token = settings.smmsToken;
    if (!token) throw new Error('请先在设置中填写 sm.ms Token');
    const form = new FormData();
    form.append('smfile', new Blob([buffer]), filename);
    const res = await fetch('https://sm.ms/api/v2/upload', {
      method: 'POST',
      headers: { Authorization: token },
      body: form
    });
    const json = await res.json();
    if (json.success) return json.data.url;
    if (json.code === 'image_repeated' && json.images) return json.images;
    throw new Error(json.message || 'sm.ms 上传失败');
  }

  if (provider === 'imgbb') {
    const key = settings.imgbbKey;
    if (!key) throw new Error('请先在设置中填写 imgbb Key');
    const base64 = Buffer.from(buffer).toString('base64');
    const form = new FormData();
    form.append('image', base64);
    const res = await fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(key), {
      method: 'POST',
      body: form
    });
    const json = await res.json();
    if (json.success) return json.data.url;
    throw new Error('imgbb 上传失败');
  }

  if (provider === 'custom') {
    const apiUrl = (settings.customApiUrl || '').trim();
    if (!apiUrl) throw new Error('请先在设置中填写自定义图床 API 地址');
    const form = new FormData();
    form.append(settings.customFileField || 'file', new Blob([buffer]), filename);
    if (settings.customExtraFields) {
      for (const line of settings.customExtraFields.split('\n')) {
        const idx = line.indexOf('=');
        if (idx > 0) form.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
      }
    }
    const headers = {};
    if (settings.customToken) {
      headers[settings.customTokenHeader || 'Authorization'] = settings.customToken;
    }
    const res = await fetch(apiUrl, { method: 'POST', headers: headers, body: form });
    const text = await res.text();
    let url;
    try {
      const json = JSON.parse(text);
      const p = (settings.customResponsePath || '').trim();
      if (p) {
        url = p.split('.').reduce((o, k) => (o == null ? o : o[k]), json);
      } else {
        url = json.url || (json.data && json.data.url) || json.link || (json.image && json.image.url);
      }
    } catch (e) {
      url = text.trim();
    }
    if (!url || !/^https?:\/\//.test(String(url))) throw new Error('自定义图床返回无效 URL: ' + text.slice(0, 200));
    return String(url);
  }

  throw new Error('未知图床服务: ' + provider);
}

module.exports = { uploadImage };
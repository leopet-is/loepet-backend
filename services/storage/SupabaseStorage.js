const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'uploads';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const prefijo = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const seg = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${year}${month}${day}_${hora}${min}${seg}_${ms}`;
};

const getContentType = (ext) => {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
};

const updateFile = async (name, filePath) => {
  if (!supabase) throw new Error('Supabase not initialized. Check SUPABASE_URL and SUPABASE_KEY env vars.');

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(name);
  const fileName = `${prefijo()}${ext}`;
  const filePathSupabase = `${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePathSupabase, fileBuffer, {
      contentType: getContentType(ext),
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePathSupabase);

  console.log('====== URL ', urlData.publicUrl);
  return urlData.publicUrl;
};

const deleteFile = async (name) => {
  if (!supabase) throw new Error('Supabase not initialized. Check SUPABASE_URL and SUPABASE_KEY env vars.');

  const { error } = await supabase.storage
    .from(bucket)
    .remove([name]);

  if (error) throw error;
  return { success: true };
};

module.exports = {
  updateFile,
  deleteFile,
};

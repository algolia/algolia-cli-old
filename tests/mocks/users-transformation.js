module.exports = (data, cb) => {
  const record = Object.assign({}, data);
  record.score = Math.floor(Math.random() * 100);
  cb(null, record);
};

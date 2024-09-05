function removeNewline (str) {
  return str.replace(/\s+/g, ' ').trim();
}

module.exports = removeNewline
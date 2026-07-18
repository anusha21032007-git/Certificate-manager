const db = require('../config/db');

// @route   POST /api/certificates
// @desc    Create a new certificate
// @access  Private
exports.createCertificate = async (req, res) => {
  const { title, organization, category, issue_date, verification_url, description } = req.body;

  if (!title || !organization || !category) {
    return res.status(400).json({ message: 'Title, organization, and category are required' });
  }

  // Multer file validation
  if (!req.file) {
    return res.status(400).json({ message: 'Certificate file upload is required' });
  }

  const filePath = req.file.filename;

  try {
    const [result] = await db.query(
      'INSERT INTO certificates (user_id, title, organization, category, issue_date, verification_url, description, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        title,
        organization,
        category,
        issue_date || new Date().toISOString().split('T')[0],
        verification_url || '#',
        description || 'No description provided.',
        filePath
      ]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: req.user.id,
      title,
      organization,
      category,
      issue_date,
      verification_url,
      description,
      file_path: filePath,
      message: 'Certificate created successfully'
    });
  } catch (error) {
    console.error('Create certificate error:', error.message);
    res.status(500).json({ message: 'Server error creating certificate' });
  }
};

// @route   GET /api/certificates
// @desc    Get all certificates of logged-in user
// @access  Private
exports.getCertificates = async (req, res) => {
  try {
    const [certs] = await db.query(
      'SELECT * FROM certificates WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(certs);
  } catch (error) {
    console.error('Get certificates error:', error.message);
    res.status(500).json({ message: 'Server error fetching certificates' });
  }
};

// @route   PUT /api/certificates/:id
// @desc    Update an existing certificate
// @access  Private
exports.updateCertificate = async (req, res) => {
  const { id } = req.params;
  const { title, organization, category, issue_date, verification_url, description } = req.body;

  try {
    // Check if certificate exists and belongs to the user
    const [existing] = await db.query(
      'SELECT * FROM certificates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const currentCert = existing[0];

    // Build update fields
    let updatedTitle = title !== undefined ? title : currentCert.title;
    let updatedOrg = organization !== undefined ? organization : currentCert.organization;
    let updatedCategory = category !== undefined ? category : currentCert.category;
    let updatedDate = issue_date !== undefined ? issue_date : currentCert.issue_date;
    let updatedUrl = verification_url !== undefined ? verification_url : currentCert.verification_url;
    let updatedDesc = description !== undefined ? description : currentCert.description;
    let updatedFilePath = currentCert.file_path;

    if (req.file) {
      updatedFilePath = req.file.filename;
    }

    await db.query(
      'UPDATE certificates SET title = ?, organization = ?, category = ?, issue_date = ?, verification_url = ?, description = ?, file_path = ? WHERE id = ? AND user_id = ?',
      [
        updatedTitle,
        updatedOrg,
        updatedCategory,
        updatedDate,
        updatedUrl,
        updatedDesc,
        updatedFilePath,
        id,
        req.user.id
      ]
    );

    res.json({
      id,
      user_id: req.user.id,
      title: updatedTitle,
      organization: updatedOrg,
      category: updatedCategory,
      issue_date: updatedDate,
      verification_url: updatedUrl,
      description: updatedDesc,
      file_path: updatedFilePath,
      message: 'Certificate updated successfully'
    });
  } catch (error) {
    console.error('Update certificate error:', error.message);
    res.status(500).json({ message: 'Server error updating certificate' });
  }
};

// @route   DELETE /api/certificates/:id
// @desc    Delete a certificate
// @access  Private
exports.deleteCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    // Check ownership
    const [existing] = await db.query(
      'SELECT id FROM certificates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    await db.query('DELETE FROM certificates WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Delete certificate error:', error.message);
    res.status(500).json({ message: 'Server error deleting certificate' });
  }
};

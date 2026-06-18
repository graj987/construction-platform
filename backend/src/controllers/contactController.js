const ContactRequest = require('../models/ContactRequest');
const Client = require('../models/Client');

exports.submitContact = async (req, res) => {
  try {
    const contact = await ContactRequest.create(req.body);
    res.status(201).json({ success: true, message: 'Your request has been submitted. We will contact you shortly.', data: contact });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const { isRead } = req.query;
    const query = {};
    if (isRead !== undefined) query.isRead = isRead === 'true';
    const contacts = await ContactRequest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const contact = await ContactRequest.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.convertToClient = async (req, res) => {
  try {
    const contact = await ContactRequest.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    const client = await Client.create({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      location: contact.location,
      plotSize: contact.plotSize,
      budget: contact.budget ? Number(contact.budget.replace(/[^0-9]/g, '')) : undefined,
      notes: contact.message,
      source: 'Website',
      status: 'Contacted',
    });

    contact.isConverted = true;
    contact.convertedClientId = client._id;
    await contact.save();

    res.json({ success: true, data: client, message: 'Contact converted to client' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

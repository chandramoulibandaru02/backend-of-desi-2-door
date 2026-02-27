const axios = require('axios');

/**
 * Sends a free notification to a Telegram Group.
 * Function name kept as 'sendWhatsAppNotification' for compatibility.
 */
const sendWhatsAppNotification = async (order) => {
  try {
    // Uses the Telegram API Key you received
    const apiKey = process.env.TELEGRAM_API_KEY; 

    if (!apiKey || apiKey === 'your_api_key') {
      console.log('⚠️ Telegram/WhatsApp API key not configured.');
      return false;
    }

    // Format the items for clear reading in the Telegram group
    const itemsList = order.items
      .map((item, i) => `   ${i + 1}. ${item.name} x ${item.quantity} = Rs.${item.price * item.quantity}`)
      .join('\n');

    // Construct the message with clean formatting
    const message = 
      `🌿 *Desi2Door - NEW ORDER ALERT* 🌿\n\n` +
      `🎫 *Order ID:* ${order.invoiceNumber}\n` +
      `👤 *Customer:* ${order.customerName}\n` +
      `📱 *Phone:* ${order.customerPhone}\n\n` +
      `📍 *Address:* ${order.address.street}, ${order.address.city}\n` +
      `🕐 *Slot:* ${order.deliverySlot || 'Not specified'}\n\n` +
      `🛒 *Items:*\n${itemsList}\n\n` +
      `💰 *TOTAL AMOUNT:* Rs.${order.totalAmount}\n` +
      `${order.notes ? `\n📝 *Notes:* ${order.notes}` : ''}`;

    // Telegram Group URL using the CallMeBot API
    const url = `https://api.callmebot.com/telegram/group.php?apikey=${apiKey}&text=${encodeURIComponent(message)}`;

    // Send the notification
    await axios.get(url);

    console.log('✅ Telegram notification (mapped as WhatsApp) sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Notification failed:', error.message);
    return false;
  }
};

module.exports = { sendWhatsAppNotification };
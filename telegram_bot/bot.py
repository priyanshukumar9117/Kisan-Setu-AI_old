import os
import requests
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

from telegram import InlineKeyboardButton, InlineKeyboardMarkup

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a message with buttons when the command /start is issued."""
    user_name = update.effective_user.first_name
    welcome_msg = (
        f"नमस्कार {user_name}! 🙏\n"
        "Welcome to *Kisan_Setu AI(किसान सेतु)*! 🌾\n\n"
        "I am your AI-powered agricultural assistant for Bihar farmers. I can help you with:\n"
        "✅ Crop Diseases & Treatments (Rice, Wheat, Maize, Pulses)\n"
        "✅ Fertilizer Recommendations for Bihar soil\n"
        "✅ Latest Mandi Prices in Bihar\n"
        "✅ Bihar Government Schemes\n\n"
        "Please select your preferred language to begin:"
    )
    
    keyboard = [
        [
            InlineKeyboardButton("English 🇬🇧", callback_data='lang_en'),
            InlineKeyboardButton("हिन्दी 🇮🇳", callback_data='lang_hi'),
            InlineKeyboardButton("भोजपुरी 🌾", callback_data='lang_bho')
        ],
        [
            InlineKeyboardButton("Text Mode 📝", callback_data='mode_text'),
            InlineKeyboardButton("Voice Mode 🎙️", callback_data='mode_voice')
        ],
        [
            InlineKeyboardButton("Local TTS 💻", callback_data='tts_local'),
            InlineKeyboardButton("Google TTS ☁️", callback_data='tts_google')
        ],
        [
            InlineKeyboardButton("Help ❓", callback_data='help'),
            InlineKeyboardButton("Settings ⚙️", callback_data='settings')
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(welcome_msg, reply_markup=reply_markup, parse_mode='Markdown')
    else:
        # For callback queries
        await update.callback_query.edit_message_text(welcome_msg, reply_markup=reply_markup, parse_mode='Markdown')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start(update, context)

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    if data.startswith('lang_'):
        lang = data.split('_')[1]
        await set_language_internal(query, lang)
    elif data.startswith('mode_'):
        mode = data.split('_')[1]
        await set_mode_internal(query, mode)
    elif data.startswith('tts_'):
        tts = data.split('_')[1]
        await set_tts_internal(query, tts)
    elif data == 'start':
        await start(update, context)
    elif data == 'help':
        await help_command(update, context)
    elif data == 'settings':
        await show_settings(query)

async def set_tts_internal(query, tts):
    user_id = str(query.from_user.id)
    try:
        response = requests.post(f"{BACKEND_URL}/set-tts/", json={"user_id": user_id, "tts_provider": tts})
        if response.status_code == 200:
            await query.message.reply_text(f"TTS provider set to {tts}.")
        else:
            await query.message.reply_text("Failed to update TTS.")
    except Exception as e:
        await query.message.reply_text(f"Error: {e}")

async def set_language_internal(query_or_update, lang):
    if hasattr(query_or_update, 'from_user'):
        user_id = str(query_or_update.from_user.id)
    else:
        user_id = str(query_or_update.message.chat_id)
        
    try:
        response = requests.post(f"{BACKEND_URL}/set-language/", json={"user_id": user_id, "language": lang})
        if response.status_code == 200:
            msgs = {
                'en': "Language set to English. How can I help you?",
                'hi': "भाषा हिंदी में सेट की गई है। मैं आपकी कैसे मदद कर सकता हूँ?",
                'bho': "भाषा भोजपुरी में सेट हो गईल बा। हम रउआ के कइसे मदद करीं?"
            }
            # Check if it is a callback query or a direct message
            if hasattr(query_or_update, 'message'):
                 await query_or_update.message.reply_text(msgs.get(lang, "Language updated."))
            else:
                 await query_or_update.reply_text(msgs.get(lang, "Language updated."))
        else:
            await (query_or_update.message if hasattr(query_or_update, 'message') else query_or_update).reply_text("Failed to update language.")
    except Exception as e:
        await (query_or_update.message if hasattr(query_or_update, 'message') else query_or_update).reply_text(f"Error: {e}")

async def show_settings(query):
    settings_msg = (
        "⚙️ *Settings*\n\n"
        "Configure your response preferences:"
    )
    keyboard = [
        [
            InlineKeyboardButton("Text Mode 📝", callback_data='mode_text'),
            InlineKeyboardButton("Voice Mode 🎙️", callback_data='mode_voice')
        ],
        [InlineKeyboardButton("Back to Main 🔙", callback_data='start')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(settings_msg, reply_markup=reply_markup, parse_mode='Markdown')

async def set_mode_internal(query, mode):
    user_id = str(query.from_user.id)
    try:
        response = requests.post(f"{BACKEND_URL}/set-mode/", json={"user_id": user_id, "mode": mode})
        if response.status_code == 200:
            await query.message.reply_text(f"Mode set to {mode}.")
        else:
            await query.message.reply_text("Failed to update mode.")
    except Exception as e:
        await query.message.reply_text(f"Error: {e}")

async def set_language(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) == 0 or context.args[0] not in ['en', 'hi', 'bho']:
        await update.message.reply_text("Usage: /language [en|hi|bho]")
        return
    await set_language_internal(update, context.args[0])

async def set_mode(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) == 0 or context.args[0] not in ['text', 'voice']:
        await update.message.reply_text("Usage: /mode [text|voice]")
        return
    mode = context.args[0]
    user_id = str(update.message.chat_id)
    try:
        response = requests.post(f"{BACKEND_URL}/set-mode/", json={"user_id": user_id, "mode": mode})
        if response.status_code == 200:
            await update.message.reply_text(f"Mode set to {mode}.")
        else:
            await update.message.reply_text("Failed to update mode.")
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

async def set_tts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) == 0 or context.args[0] not in ['local', 'google']:
        await update.message.reply_text("Usage: /tts [local|google]")
        return
    tts = context.args[0]
    user_id = str(update.message.chat_id)
    try:
        response = requests.post(f"{BACKEND_URL}/set-tts/", json={"user_id": user_id, "tts_provider": tts})
        if response.status_code == 200:
            await update.message.reply_text(f"TTS provider set to {tts}.")
        else:
            await update.message.reply_text("Failed to update TTS.")
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

async def process_query(update: Update, user_id: str, text: str = None, audio_path: str = None):
    # Determine loading text string
    if update.message:
        processing_msg = await update.message.reply_text("🔍 Searching for info...")
    else:
        processing_msg = await update.callback_query.message.reply_text("🔍 Searching for info...")
    
    try:
        payload = {"user_id": user_id}
        if text:
            payload["text"] = text
            
        files = None
        if audio_path and os.path.exists(audio_path):
            files = {'audio': open(audio_path, 'rb')}
            await processing_msg.edit_text("🎙️ Transcribing audio...")
            
        # Post request to Django Rest API
        await processing_msg.edit_text("🧠 Thinking...")
        
        if files:
            response = requests.post(f"{BACKEND_URL}/query/", data=payload, files=files, timeout=90)
            files['audio'].close()
        else:
            response = requests.post(f"{BACKEND_URL}/query/", data=payload, timeout=90)
            
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response_text", "")
            audio_file = data.get("audio_file", "")
            
            await processing_msg.edit_text(response_text)
            
            if audio_file and os.path.exists(audio_file):
                with open(audio_file, 'rb') as f:
                    if update.message:
                        await update.message.reply_voice(f)
                    else:
                        await update.callback_query.message.reply_voice(f)
        else:
            await processing_msg.edit_text("❌ Failed to get a response from the brain.")
            
    except Exception as e:
        await processing_msg.edit_text(f"⚠️ System Error: {e}")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.message.chat_id)
    text = update.message.text
    await process_query(update, user_id, text=text)

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.message.chat_id)
    new_file = await context.bot.get_file(update.message.voice.file_id)
    # Give random uuid name locally to avoid overwrites
    audio_path = os.path.join(os.getcwd(), f"bot_raw_audio_{update.message.voice.file_id}.oga")
    await new_file.download_to_drive(audio_path)
    
    await process_query(update, user_id, audio_path=audio_path)
    
    if os.path.exists(audio_path):
        os.remove(audio_path)

def main():
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
        print("TELEGRAM_BOT_TOKEN is not set in .env. Please configure it.")
        return

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    from telegram.ext import CallbackQueryHandler
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("language", set_language))
    application.add_handler(CommandHandler("mode", set_mode))
    application.add_handler(CommandHandler("tts", set_tts))
    application.add_handler(CallbackQueryHandler(button_handler))
    
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    application.add_handler(MessageHandler(filters.VOICE, handle_voice))

    print("Kisan_Sarthi Telegram Bot is polling...")
    application.run_polling()

if __name__ == "__main__":
    main()

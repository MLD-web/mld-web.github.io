import asyncio
from playwright.async_api import async_playwright

async def verify_chatbot_v2():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # Load the index.html
        import os
        path = os.path.abspath("index.html")
        await page.goto(f"file://{path}")
        await page.wait_for_timeout(1000)

        # 1. Check if the chatbot widget exists
        chatbot = await page.query_selector("#chatbot-widget")
        if chatbot:
            print("Chatbot widget exists.")
        else:
            print("Chatbot widget MISSING.")

        # 2. Check if the toggle button exists
        toggle = await page.query_selector("#chat-toggle")
        if toggle:
            print("Chat-toggle button exists.")
        else:
            print("Chat-toggle MISSING.")

        # 3. Check if the panel is hidden initially
        panel = await page.query_selector("#chatbot-panel")
        is_hidden = await panel.evaluate("el => el.classList.contains('hidden')")
        print(f"Chat panel is hidden: {is_hidden}")

        # 4. Click the toggle and see if panel opens
        await toggle.click()
        await page.wait_for_timeout(500)
        is_hidden = await panel.evaluate("el => el.classList.contains('hidden')")
        print(f"Chat panel is hidden after click: {is_hidden}")

        # 5. Check if quick actions exist and are correct
        quick_actions = await page.query_selector_all(".quick-action")
        print(f"Found {len(quick_actions)} quick actions.")
        for action in quick_actions:
            text = await action.inner_text()
            print(f"Quick action text: {text}")

        # 6. Check for WhatsApp link
        wa_link = await page.query_selector("a.quick-action")
        if wa_link:
            href = await wa_link.get_attribute("href")
            print(f"WhatsApp link href: {href}")

        # Take a screenshot
        await page.screenshot(path="/home/jules/verification/chatbot_v2.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_chatbot_v2())

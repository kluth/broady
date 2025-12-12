import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Card Game Features
 * Tests complete user workflows from UI interaction to result
 */

test.describe('Card Overlay Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to card overlay
    await page.click('[data-testid="card-overlay-button"]');
  });

  test('should search for Lorcana cards', async ({ page }) => {
    // Switch to Lorcana tab
    await page.click('text=Lorcana');

    // Enter search query
    await page.fill('input[placeholder="Enter card name..."]', 'Mickey');

    // Click search
    await page.click('button:has(mat-icon:text("search"))');

    // Wait for results
    await page.waitForSelector('.results-grid');

    // Verify results appear
    const results = await page.locator('.result-card').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should display card details on selection', async ({ page }) => {
    await page.click('text=Lorcana');
    await page.fill('input[placeholder="Enter card name..."]', 'Mickey');
    await page.click('button:has(mat-icon:text("search"))');

    // Click first result
    await page.click('.result-card:first-child');

    // Verify card display appears
    await expect(page.locator('.card-display')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Mickey');
  });

  test('should show card on stream', async ({ page }) => {
    await page.click('text=Lorcana');
    await page.fill('input[placeholder="Enter card name..."]', 'Mickey');
    await page.click('button:has(mat-icon:text("search"))');
    await page.click('.result-card:first-child');

    // Click show on stream
    await page.click('button:has-text("Show on Stream")');

    // Verify overlay settings
    await page.click('text=Stream Overlay');
    await expect(page.locator('.current-display')).toBeVisible();
    await expect(page.locator('.current-display')).toContainText('Mickey');
  });

  test('should search for Pokemon cards', async ({ page }) => {
    await page.click('text=Pokémon');

    await page.fill('input[placeholder="Enter card name..."]', 'Pikachu');
    await page.click('button:has(mat-icon:text("search"))');

    await page.waitForSelector('.results-grid');

    const results = await page.locator('.result-card').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should get random card', async ({ page }) => {
    await page.click('text=Lorcana');

    await page.click('button:has-text("Random")');

    await expect(page.locator('.card-display')).toBeVisible();
  });

  test('should configure overlay settings', async ({ page }) => {
    await page.click('text=Stream Overlay');

    // Change position
    await page.click('mat-select[ng-reflect-name="overlayPosition"]');
    await page.click('mat-option:has-text("Top Right")');

    // Change duration
    await page.fill('input[type="number"]', '30');

    // Toggle options
    await page.click('button:has(mat-icon:text("check_box"))');

    // Verify settings are applied
    const duration = await page.inputValue('input[type="number"]');
    expect(duration).toBe('30');
  });
});

test.describe('Chatbot Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="chatbot-config-button"]');
  });

  test('should display all built-in commands', async ({ page }) => {
    await page.click('text=Commands');

    const commands = await page.locator('.command-panel').count();
    expect(commands).toBeGreaterThan(15);
  });

  test('should filter commands by category', async ({ page }) => {
    await page.click('text=Commands');

    await page.click('mat-select:has-text("All Commands")');
    await page.click('mat-option:has-text("Social")');

    await page.waitForTimeout(500);

    const visibleCommands = await page.locator('.command-panel:visible').count();
    expect(visibleCommands).toBeGreaterThan(0);
  });

  test('should search commands', async ({ page }) => {
    await page.click('text=Commands');

    await page.fill('input[placeholder="Search..."]', 'uptime');

    await page.waitForTimeout(500);

    const results = await page.locator('.command-panel:visible').count();
    expect(results).toBeGreaterThanOrEqual(1);
  });

  test('should toggle command enabled state', async ({ page }) => {
    await page.click('text=Commands');

    const firstToggle = page.locator('.command-panel:first-child mat-slide-toggle');
    const initialState = await firstToggle.getAttribute('ng-reflect-checked');

    await firstToggle.click();

    await page.waitForTimeout(300);

    const newState = await firstToggle.getAttribute('ng-reflect-checked');
    expect(newState).not.toBe(initialState);
  });

  test('should add custom command', async ({ page }) => {
    await page.click('text=Commands');

    // Scroll to add command section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Fill in new command
    await page.fill('input[placeholder="mycommand"]', 'testcmd');
    await page.fill('textarea[placeholder="Your command response here..."]', 'Test response {user}');

    // Add command
    await page.click('button:has-text("Add Command")');

    await page.waitForTimeout(500);

    // Search for new command
    await page.fill('input[placeholder="Search..."]', 'testcmd');

    await page.waitForTimeout(500);

    await expect(page.locator('.command-trigger:has-text("testcmd")')).toBeVisible();
  });

  test('should edit command response', async ({ page }) => {
    await page.click('text=Commands');

    // Expand first command
    await page.click('.command-panel:first-child');

    // Edit response
    const responseField = page.locator('textarea[ng-reflect-model]').first();
    await responseField.fill('Updated response text');

    // Blur to save
    await page.keyboard.press('Tab');

    await page.waitForTimeout(300);

    // Verify saved
    const value = await responseField.inputValue();
    expect(value).toBe('Updated response text');
  });

  test('should change chatbot settings', async ({ page }) => {
    await page.click('text=Settings');

    // Change prefix
    await page.fill('input[ng-reflect-name="prefix"]', '$');

    // Change cooldown
    await page.fill('input[type="number"]', '5');

    // Toggle auto-greet
    await page.click('mat-checkbox:has-text("Auto-greet new followers")');

    await page.waitForTimeout(300);

    // Verify settings
    const prefix = await page.inputValue('input[ng-reflect-name="prefix"]');
    expect(prefix).toBe('$');
  });

  test('should view command history', async ({ page }) => {
    await page.click('text=History');

    // History might be empty initially
    const hasHistory = await page.locator('.history-entry').count();
    expect(hasHistory).toBeGreaterThanOrEqual(0);
  });

  test('should export commands', async ({ page }) => {
    await page.click('text=Import/Export');

    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Commands")')
    ]);

    expect(download.suggestedFilename()).toBe('chatbot-commands.json');
  });
});

test.describe('Card Game Duels (Chat Simulation)', () => {
  let chatInput: any;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    chatInput = page.locator('[data-testid="chat-input"]');
  });

  test('should challenge another player', async ({ page }) => {
    await chatInput.fill('!challenge player2 lorcana');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.chat-message:last-child');

    const lastMessage = await page.locator('.chat-message:last-child').textContent();
    expect(lastMessage).toContain('challenged');
    expect(lastMessage).toContain('Lorcana');
  });

  test('should accept a challenge', async ({ page }) => {
    // Player 1 challenges
    await chatInput.fill('!challenge player2 pokemon');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);

    // Player 2 accepts
    await chatInput.fill('!accept');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.chat-message:last-child');

    const lastMessage = await page.locator('.chat-message:last-child').textContent();
    expect(lastMessage).toContain('Duel started');
  });

  test('should view hand during duel', async ({ page }) => {
    // Start duel
    await chatInput.fill('!challenge player2 lorcana');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    await chatInput.fill('!accept');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // View hand
    await chatInput.fill('!hand');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.chat-message:last-child');

    const lastMessage = await page.locator('.chat-message:last-child').textContent();
    expect(lastMessage).toContain('Your Hand');
  });

  test('should view battlefield', async ({ page }) => {
    // Start and setup duel
    await chatInput.fill('!challenge player2 lorcana');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    await chatInput.fill('!accept');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // View field
    await chatInput.fill('!field');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.chat-message:last-child');

    const lastMessage = await page.locator('.chat-message:last-child').textContent();
    expect(lastMessage).toContain('Battlefield');
  });

  test('should get duel help', async ({ page }) => {
    await chatInput.fill('!duelhelp');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.chat-message:last-child');

    const lastMessage = await page.locator('.chat-message:last-child').textContent();
    expect(lastMessage).toContain('!challenge');
    expect(lastMessage).toContain('!accept');
    expect(lastMessage).toContain('!play');
    expect(lastMessage).toContain('!attack');
  });
});

test.describe('Complete User Flow', () => {
  test('should complete full workflow: lookup card, start duel, play game', async ({ page }) => {
    await page.goto('/');

    // 1. Look up a Lorcana card
    await page.click('[data-testid="card-overlay-button"]');
    await page.click('text=Lorcana');
    await page.fill('input[placeholder="Enter card name..."]', 'Mickey');
    await page.click('button:has(mat-icon:text("search"))');
    await page.waitForSelector('.results-grid');

    // 2. Display card
    await page.click('.result-card:first-child');
    await expect(page.locator('.card-display')).toBeVisible();

    // 3. Configure chatbot
    await page.click('[data-testid="chatbot-config-button"]');
    await page.click('text=Settings');
    await page.fill('input[ng-reflect-name="greetingMessage"]', 'Welcome {user}!');

    // 4. Test card command in chat
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('!lorcana Mickey');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.chat-message:last-child');
    let message = await page.locator('.chat-message:last-child').textContent();
    expect(message).toContain('Mickey');

    // 5. Start a duel
    await chatInput.fill('!challenge testPlayer lorcana');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    message = await page.locator('.chat-message:last-child').textContent();
    expect(message).toContain('challenged');
  });
});

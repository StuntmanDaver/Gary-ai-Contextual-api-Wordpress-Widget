<?php
/**
 * Gary AI Settings Page Template
 *
 * @package GaryAI
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap gary-ai-admin">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="gary-ai-notices"></div>
    
    <div class="gary-ai-settings-tabs">
        <a href="#general" class="nav-tab nav-tab-active" data-tab="general">General Settings</a>
        <a href="#api" class="nav-tab" data-tab="api">API Configuration</a>
        <a href="#widget" class="nav-tab" data-tab="widget">Widget Settings</a>
        <a href="#advanced" class="nav-tab" data-tab="advanced">Advanced</a>
    </div>
    
    <form id="gary-ai-settings-form" method="post" action="options.php">
        <?php settings_fields('gary_ai_settings'); ?>
        
        <!-- General Settings Panel -->
        <div id="gary-ai-panel-general" class="gary-ai-settings-panel">
            <h2>General Settings</h2>
            <table class="gary-ai-form-table">
                <tr>
                    <th scope="row">
                        <label for="gary_ai_widget_enabled">Enable Chat Widget</label>
                    </th>
                    <td>
                        <input type="checkbox" 
                               id="gary_ai_widget_enabled" 
                               name="gary_ai_widget_enabled" 
                               value="1" 
                               <?php checked($settings['widget_enabled'] ?? false); ?> />
                        <p class="gary-ai-help-text">Enable the Gary AI chat widget on your website</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_widget_position">Widget Position</label>
                    </th>
                    <td>
                        <select id="gary_ai_widget_position" name="gary_ai_widget_position" class="gary-ai-input">
                            <option value="bottom-right" <?php selected($settings['widget_position'] ?? 'bottom-right', 'bottom-right'); ?>>Bottom Right</option>
                            <option value="bottom-left" <?php selected($settings['widget_position'] ?? 'bottom-right', 'bottom-left'); ?>>Bottom Left</option>
                            <option value="top-right" <?php selected($settings['widget_position'] ?? 'bottom-right', 'top-right'); ?>>Top Right</option>
                            <option value="top-left" <?php selected($settings['widget_position'] ?? 'bottom-right', 'top-left'); ?>>Top Left</option>
                        </select>
                        <p class="gary-ai-help-text">Choose where to display the chat widget on your site</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- API Configuration Panel -->
        <div id="gary-ai-panel-api" class="gary-ai-settings-panel" style="display: none;">
            <h2>API Configuration</h2>
            <div class="gary-ai-connection-status">
                <span class="gary-ai-status-indicator disconnected"></span>
                <span class="status-text">Disconnected</span>
                <button type="button" id="test-api-connection" class="gary-ai-button secondary" style="margin-left: 10px;">Test Connection</button>
            </div>
            
            <table class="gary-ai-form-table">
                <tr>
                    <th scope="row">
                        <label for="gary_ai_api_key">API Key</label>
                    </th>
                    <td>
                        <input type="password" 
                               id="gary_ai_api_key" 
                               name="gary_ai_api_key" 
                               value="<?php echo esc_attr($settings['api_key'] ?? ''); ?>" 
                               class="gary-ai-input" 
                               placeholder="Enter your Contextual AI API key" />
                        <p class="gary-ai-help-text">Your Contextual AI API key from the dashboard</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_agent_id">Agent ID</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="gary_ai_agent_id" 
                               name="gary_ai_agent_id" 
                               value="<?php echo esc_attr($settings['agent_id'] ?? ''); ?>" 
                               class="gary-ai-input" 
                               placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        <p class="gary-ai-help-text">The UUID of your Gary AI agent</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_datastore_id">Datastore ID</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="gary_ai_datastore_id" 
                               name="gary_ai_datastore_id" 
                               value="<?php echo esc_attr($settings['datastore_id'] ?? ''); ?>" 
                               class="gary-ai-input" 
                               placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        <p class="gary-ai-help-text">The UUID of your datastore (optional)</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Widget Settings Panel -->
        <div id="gary-ai-panel-widget" class="gary-ai-settings-panel" style="display: none;">
            <h2>Widget Customization</h2>
            <table class="gary-ai-form-table">
                <tr>
                    <th scope="row">
                        <label for="gary_ai_widget_title">Widget Title</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="gary_ai_widget_title" 
                               name="gary_ai_widget_title" 
                               value="<?php echo esc_attr($settings['widget_title'] ?? 'Gary AI Assistant'); ?>" 
                               class="gary-ai-input" />
                        <p class="gary-ai-help-text">Title displayed in the chat widget header</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_welcome_message">Welcome Message</label>
                    </th>
                    <td>
                        <textarea id="gary_ai_welcome_message" 
                                  name="gary_ai_welcome_message" 
                                  class="gary-ai-textarea" 
                                  rows="3"><?php echo esc_textarea($settings['welcome_message'] ?? 'Hi! I\'m Gary, your AI assistant. How can I help you today?'); ?></textarea>
                        <p class="gary-ai-help-text">Initial message shown to users when they open the chat</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_widget_color">Primary Color</label>
                    </th>
                    <td>
                        <input type="color" 
                               id="gary_ai_widget_color" 
                               name="gary_ai_widget_color" 
                               value="<?php echo esc_attr($settings['widget_color'] ?? '#0073aa'); ?>" />
                        <p class="gary-ai-help-text">Primary color for the chat widget</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Advanced Settings Panel -->
        <div id="gary-ai-panel-advanced" class="gary-ai-settings-panel" style="display: none;">
            <h2>Advanced Settings</h2>
            <table class="gary-ai-form-table">
                <tr>
                    <th scope="row">
                        <label for="gary_ai_rate_limit">Rate Limit (per minute)</label>
                    </th>
                    <td>
                        <input type="number" 
                               id="gary_ai_rate_limit" 
                               name="gary_ai_rate_limit" 
                               value="<?php echo esc_attr($settings['rate_limit'] ?? 10); ?>" 
                               class="gary-ai-input" 
                               min="1" 
                               max="100" />
                        <p class="gary-ai-help-text">Maximum API requests per user per minute</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_debug_mode">Debug Mode</label>
                    </th>
                    <td>
                        <input type="checkbox" 
                               id="gary_ai_debug_mode" 
                               name="gary_ai_debug_mode" 
                               value="1" 
                               <?php checked($settings['debug_mode'] ?? false); ?> />
                        <p class="gary-ai-help-text">Enable debug logging (not recommended for production)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="gary_ai_custom_css">Custom CSS</label>
                    </th>
                    <td>
                        <textarea id="gary_ai_custom_css" 
                                  name="gary_ai_custom_css" 
                                  class="gary-ai-textarea" 
                                  rows="10"><?php echo esc_textarea($settings['custom_css'] ?? ''); ?></textarea>
                        <p class="gary-ai-help-text">Custom CSS to override widget styling</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <?php submit_button('Save Settings', 'primary', 'submit', false, ['class' => 'gary-ai-button']); ?>
    </form>
</div>

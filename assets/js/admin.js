// Gary AI Admin Interface JavaScript

(function($) {
    'use strict';

    // Initialize admin interface when DOM is ready
    $(document).ready(function() {
        initTabs();
        initFormValidation();
        initApiTesting();
        initSettingsSync();
    });

    /**
     * Initialize tabbed interface
     */
    function initTabs() {
        $('.gary-ai-settings-tabs .nav-tab').on('click', function(e) {
            e.preventDefault();
            
            const targetTab = $(this).data('tab');
            
            // Update active tab
            $('.gary-ai-settings-tabs .nav-tab').removeClass('nav-tab-active');
            $(this).addClass('nav-tab-active');
            
            // Show corresponding panel
            $('.gary-ai-settings-panel').hide();
            $('#gary-ai-panel-' + targetTab).show();
        });
    }

    /**
     * Initialize form validation
     */
    function initFormValidation() {
        $('#gary-ai-settings-form').on('submit', function(e) {
            let isValid = true;
            
            // Validate API key
            const apiKey = $('#gary_ai_api_key').val();
            if (!apiKey || apiKey.length < 10) {
                showNotice('Please enter a valid API key', 'error');
                isValid = false;
            }
            
            // Validate agent ID (UUID format)
            const agentId = $('#gary_ai_agent_id').val();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!agentId || !uuidRegex.test(agentId)) {
                showNotice('Please enter a valid Agent ID (UUID format)', 'error');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }

    /**
     * Initialize API connection testing
     */
    function initApiTesting() {
        $('#test-api-connection').on('click', function(e) {
            e.preventDefault();
            
            const button = $(this);
            const originalText = button.text();
            
            button.text('Testing...').prop('disabled', true);
            
            const data = {
                action: 'gary_ai_test_connection',
                nonce: garyAiAdmin.nonce,
                api_key: $('#gary_ai_api_key').val(),
                agent_id: $('#gary_ai_agent_id').val()
            };
            
            $.post(ajaxurl, data)
                .done(function(response) {
                    if (response.success) {
                        showNotice('API connection successful!', 'success');
                        updateConnectionStatus(true);
                    } else {
                        showNotice('API connection failed: ' + response.data.message, 'error');
                        updateConnectionStatus(false);
                    }
                })
                .fail(function() {
                    showNotice('Connection test failed. Please try again.', 'error');
                    updateConnectionStatus(false);
                })
                .always(function() {
                    button.text(originalText).prop('disabled', false);
                });
        });
    }

    /**
     * Initialize settings synchronization
     */
    function initSettingsSync() {
        // Auto-save settings on change (debounced)
        let saveTimeout;
        $('.gary-ai-input, .gary-ai-textarea').on('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function() {
                saveSettings(false); // Silent save
            }, 2000);
        });
    }

    /**
     * Save settings via AJAX
     */
    function saveSettings(showNotification = true) {
        const formData = $('#gary-ai-settings-form').serialize();
        
        $.post(ajaxurl, {
            action: 'gary_ai_save_settings',
            nonce: garyAiAdmin.nonce,
            settings: formData
        })
        .done(function(response) {
            if (response.success && showNotification) {
                showNotice('Settings saved successfully!', 'success');
            }
        })
        .fail(function() {
            if (showNotification) {
                showNotice('Failed to save settings. Please try again.', 'error');
            }
        });
    }

    /**
     * Show admin notice
     */
    function showNotice(message, type = 'info') {
        const notice = $('<div class="gary-ai-notice ' + type + '">' + message + '</div>');
        $('.gary-ai-notices').empty().append(notice);
        
        // Auto-hide after 5 seconds
        setTimeout(function() {
            notice.fadeOut();
        }, 5000);
    }

    /**
     * Update connection status indicator
     */
    function updateConnectionStatus(connected) {
        const indicator = $('.gary-ai-status-indicator');
        indicator.removeClass('connected disconnected pending');
        indicator.addClass(connected ? 'connected' : 'disconnected');
        
        const statusText = connected ? 'Connected' : 'Disconnected';
        indicator.next('.status-text').text(statusText);
    }

    // Export functions for external use
    window.garyAiAdmin = {
        showNotice: showNotice,
        saveSettings: saveSettings,
        updateConnectionStatus: updateConnectionStatus
    };

})(jQuery);

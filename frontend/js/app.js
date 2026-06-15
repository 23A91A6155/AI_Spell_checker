/* ============================================================
   AI Grammar & Spell Checker — Application Logic
   ============================================================ */

(() => {
    'use strict';

    // ── API Base URLs ────────────────────────────────────────
    const FLASK_API  = 'http://localhost:5000/api';
    const DJANGO_API = 'http://localhost:8000/api';

    // ── DOM References (cached) ──────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        // Loading & Toast
        loadingOverlay:     $('#loading-overlay'),
        toastContainer:     $('#toast-container'),

        // Header
        btnToggleDarkMode:  $('#btn-toggle-darkmode'),
        iconMoon:           $('#icon-darkmode-moon'),
        iconSun:            $('#icon-darkmode-sun'),

        // Toolbar
        btnGrammar:         $('#btn-grammar-check'),
        btnSpelling:        $('#btn-spell-check'),
        btnClarity:         $('#btn-clarity'),
        btnReadability:     $('#btn-readability'),
        btnFullCheck:       $('#btn-full-check'),

        // Panes
        textInput:          $('#text-input'),
        wordCount:          $('#input-word-count'),
        textOutput:         $('#text-output'),
        outputPlaceholder:  $('#output-placeholder'),
        outputDiff:         $('#output-diff'),
        btnCopy:            $('#btn-copy-corrected'),

        // Stats
        statErrors:         $('#stat-errors-count'),
        statCorrections:    $('#stat-corrections-count'),
        statReadability:    $('#stat-readability-score'),

        // Corrections Panel
        correctionsPanel:   $('#corrections-panel'),
        correctionsList:    $('#corrections-list'),
        correctionsBadge:   $('#corrections-count-badge'),

        // History
        btnToggleHistory:   $('#btn-toggle-history'),
        btnCloseHistory:    $('#btn-close-history'),
        historySidebar:     $('#history-sidebar'),
        historyList:        $('#history-list'),
        historyEmpty:       $('#history-empty'),
        appWrapper:         $('#app-wrapper'),
    };

    // ── State ────────────────────────────────────────────────
    let correctedText = '';

    // ============================================================
    //  DARK MODE
    // ============================================================

    function initTheme() {
        const saved = localStorage.getItem('theme');
        // Default to dark
        const theme = saved || 'dark';
        applyTheme(theme);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            dom.iconMoon.style.display = 'none';
            dom.iconSun.style.display  = 'inline';
        } else {
            dom.iconMoon.style.display = 'inline';
            dom.iconSun.style.display  = 'none';
        }
    }

    function toggleDarkMode() {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    // ============================================================
    //  LOADING OVERLAY
    // ============================================================

    function showLoading() {
        dom.loadingOverlay.classList.add('active');
        dom.loadingOverlay.setAttribute('aria-hidden', 'false');
    }

    function hideLoading() {
        dom.loadingOverlay.classList.remove('active');
        dom.loadingOverlay.setAttribute('aria-hidden', 'true');
    }

    // ============================================================
    //  TOAST NOTIFICATIONS
    // ============================================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        const icons = {
            success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
            error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        };

        toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
        dom.toastContainer.appendChild(toast);

        // Auto-remove after animation completes
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 4000);
    }

    // ============================================================
    //  WORD & CHARACTER COUNTER
    // ============================================================

    function updateWordCount() {
        const text = dom.textInput.value;
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        dom.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''} · ${chars} character${chars !== 1 ? 's' : ''}`;
    }

    // ============================================================
    //  API CALLS
    // ============================================================

    async function apiPost(endpoint, body) {
        const response = await fetch(`${FLASK_API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error ${response.status}`);
        }
        return response.json();
    }

    function getInputText() {
        const text = dom.textInput.value.trim();
        if (!text) {
            showToast('Please enter some text first.', 'warning');
            dom.textInput.focus();
            return null;
        }
        return text;
    }

    async function checkGrammar() {
        const text = getInputText();
        if (!text) return;
        showLoading();
        try {
            const data = await apiPost('/check-grammar', { text });
            displayResults(data);
            showToast('Grammar check complete!', 'success');
        } catch (err) {
            showToast(`Grammar check failed: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async function checkSpelling() {
        const text = getInputText();
        if (!text) return;
        showLoading();
        try {
            const data = await apiPost('/check-spelling', { text });
            displayResults(data);
            showToast('Spell check complete!', 'success');
        } catch (err) {
            showToast(`Spell check failed: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async function improveClarity() {
        const text = getInputText();
        if (!text) return;
        showLoading();
        try {
            const data = await apiPost('/improve-clarity', { text });
            displayResults(data);
            showToast('Clarity improvement complete!', 'success');
        } catch (err) {
            showToast(`Clarity check failed: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async function analyzeReadability() {
        const text = getInputText();
        if (!text) return;
        showLoading();
        try {
            const data = await apiPost('/readability', { text });
            displayResults(data);
            showToast('Readability analysis complete!', 'success');
        } catch (err) {
            showToast(`Readability analysis failed: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async function fullCheck() {
        const text = getInputText();
        if (!text) return;
        showLoading();
        try {
            const data = await apiPost('/full-check', { text });
            displayResults(data);
            showToast('Full check complete!', 'success');
        } catch (err) {
            showToast(`Full check failed: ${err.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    // ============================================================
    //  DISPLAY RESULTS
    // ============================================================

    function displayResults(data) {
        const original = dom.textInput.value;

        let resolvedText, corrections, errors, readability;

        // ── FULL CHECK (nested response) ──
        if (data.grammar && data.spelling && data.clarity && data.readability) {
            const g = data.grammar   || {};
            const s = data.spelling  || {};
            const c = data.clarity   || {};
            const r = data.readability || {};

            resolvedText = g.corrected_text || c.improved_text || original;
            corrections  = [].concat(g.errors || [], s.errors || [], c.changes || []);
            errors       = data.total_errors ?? ((g.error_count || 0) + (s.error_count || 0));
            readability  = r.readability_score ?? '—';

            // Also add readability suggestions as corrections
            if (r.suggestions && r.suggestions.length > 0) {
                r.suggestions.forEach(s => {
                    corrections.push({
                        original: s.issue || 'Readability',
                        correction: s.recommendation || '',
                        explanation: `Priority: ${s.priority || 'medium'}`,
                        type: 'readability'
                    });
                });
            }

        // ── READABILITY (has suggestions, overall_assessment, no corrected_text) ──
        } else if (data.suggestions !== undefined || data.overall_assessment !== undefined) {
            readability  = data.readability_score ?? '—';
            errors       = 0;

            // Build a rich output for readability
            const assessment = data.overall_assessment || '';
            const audience   = data.target_audience || '';
            const grade      = data.grade_level ?? '—';
            const wc         = data.word_count ?? '—';
            const sc         = data.sentence_count ?? '—';
            const avgSL      = data.avg_sentence_length ?? '—';

            // Show assessment in the output panel instead of diff
            resolvedText = original;

            // Convert suggestions into displayable corrections
            corrections = [];
            if (data.suggestions && data.suggestions.length > 0) {
                data.suggestions.forEach(s => {
                    corrections.push({
                        original: s.issue || 'Readability issue',
                        correction: s.recommendation || '',
                        explanation: `Priority: ${s.priority || 'medium'}`,
                        type: 'readability'
                    });
                });
                errors = corrections.length;
            }

            // Render readability info in output panel
            dom.outputPlaceholder.style.display = 'none';
            dom.outputDiff.style.display = 'block';
            dom.outputDiff.innerHTML = `
                <div class="readability-report">
                    <div class="readability-metrics">
                        <div class="metric-item"><span class="metric-label">Reading Ease</span><span class="metric-value">${readability}/100</span></div>
                        <div class="metric-item"><span class="metric-label">Grade Level</span><span class="metric-value">${grade}</span></div>
                        <div class="metric-item"><span class="metric-label">Words</span><span class="metric-value">${wc}</span></div>
                        <div class="metric-item"><span class="metric-label">Sentences</span><span class="metric-value">${sc}</span></div>
                        <div class="metric-item"><span class="metric-label">Avg Sentence Length</span><span class="metric-value">${avgSL} words</span></div>
                        <div class="metric-item"><span class="metric-label">Target Audience</span><span class="metric-value">${escapeHtml(audience)}</span></div>
                    </div>
                    ${assessment ? `<div class="readability-assessment"><strong>Assessment:</strong> ${escapeHtml(assessment)}</div>` : ''}
                </div>
            `;

            correctedText = original;

            // Stats
            animateStat(dom.statErrors, errors);
            animateStat(dom.statCorrections, errors);
            animateStat(dom.statReadability, readability);

            // Corrections panel (suggestions)
            if (corrections.length > 0) {
                dom.correctionsPanel.style.display = 'block';
                dom.correctionsBadge.textContent = corrections.length;
                renderCorrections(corrections);
            } else {
                dom.correctionsPanel.style.display = 'none';
            }
            return; // Exit early — we handled everything

        // ── CLARITY (improved_text + changes) ──
        } else if (data.improved_text !== undefined) {
            resolvedText = data.improved_text || original;
            corrections  = data.changes || [];
            errors       = corrections.length;
            readability  = data.clarity_score ?? '—';

        // ── GRAMMAR / SPELLING (corrected_text + errors) ──
        } else {
            resolvedText = data.corrected_text || original;
            corrections  = data.errors || [];
            errors       = data.error_count ?? corrections.length;
            readability  = data.readability_score ?? '—';
        }

        correctedText = resolvedText;
        const made    = corrections.length;

        // Output panel — show diff
        dom.outputPlaceholder.style.display = 'none';
        dom.outputDiff.style.display = 'block';
        dom.outputDiff.innerHTML = highlightDifferences(original, correctedText);

        // Stats cards — animate
        animateStat(dom.statErrors, errors);
        animateStat(dom.statCorrections, made);
        animateStat(dom.statReadability, readability);

        // Corrections detail panel
        if (corrections.length > 0) {
            dom.correctionsPanel.style.display = 'block';
            dom.correctionsBadge.textContent = corrections.length;
            renderCorrections(corrections);
        } else {
            dom.correctionsPanel.style.display = 'none';
        }
    }

    function animateStat(el, value) {
        el.textContent = value;
        el.classList.remove('animate-pulse');
        // Trigger reflow
        void el.offsetWidth;
        el.classList.add('animate-pulse');
    }

    // ============================================================
    //  WORD-LEVEL DIFF HIGHLIGHTING
    // ============================================================

    function highlightDifferences(original, corrected) {
        const origWords = original.split(/(\s+)/);
        const corrWords = corrected.split(/(\s+)/);

        // Simple LCS-based diff
        const diff = computeDiff(origWords, corrWords);
        let html = '';

        diff.forEach((part) => {
            if (part.type === 'equal') {
                html += escapeHtml(part.value);
            } else if (part.type === 'remove') {
                html += `<span class="diff-removed">${escapeHtml(part.value)}</span>`;
            } else if (part.type === 'add') {
                html += `<span class="diff-added">${escapeHtml(part.value)}</span>`;
            }
        });

        return html;
    }

    function computeDiff(a, b) {
        // Build a simple edit-script using the Myers-like approach
        const n = a.length;
        const m = b.length;
        const max = n + m;
        const result = [];

        // For small texts, use a straightforward O(NM) DP
        if (max > 4000) {
            // Fallback for very large texts: simple sequential comparison
            return simpleDiff(a, b);
        }

        // LCS Table
        const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // Backtrack
        let i = n, j = m;
        const parts = [];
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
                parts.push({ type: 'equal', value: a[i - 1] });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                parts.push({ type: 'add', value: b[j - 1] });
                j--;
            } else {
                parts.push({ type: 'remove', value: a[i - 1] });
                i--;
            }
        }

        parts.reverse();

        // Merge consecutive same-type parts
        for (const part of parts) {
            const last = result[result.length - 1];
            if (last && last.type === part.type) {
                last.value += part.value;
            } else {
                result.push({ ...part });
            }
        }

        return result;
    }

    function simpleDiff(a, b) {
        const result = [];
        const maxLen = Math.max(a.length, b.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < a.length && i < b.length) {
                if (a[i] === b[i]) {
                    result.push({ type: 'equal', value: a[i] });
                } else {
                    result.push({ type: 'remove', value: a[i] });
                    result.push({ type: 'add', value: b[i] });
                }
            } else if (i < a.length) {
                result.push({ type: 'remove', value: a[i] });
            } else {
                result.push({ type: 'add', value: b[i] });
            }
        }
        return result;
    }

    function escapeHtml(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, (c) => map[c]);
    }

    // ============================================================
    //  CORRECTIONS LIST
    // ============================================================

    function renderCorrections(corrections) {
        dom.correctionsList.innerHTML = '';

        corrections.forEach((item, idx) => {
            const original    = item.original    || item.before || item.from || '';
            const fixed       = item.correction  || item.after  || item.corrected || item.to || item.fixed || '';
            const explanation = item.explanation  || item.reason || item.message || 'No explanation provided.';
            const errorType   = item.type         || '';

            const li = document.createElement('li');
            li.className = 'correction-item';
            li.innerHTML = `
                <div class="correction-item-header">
                    <div class="correction-change">
                        <span class="correction-original">${escapeHtml(original)}</span>
                        <span class="correction-arrow">→</span>
                        <span class="correction-fixed">${escapeHtml(fixed)}</span>
                    </div>
                    <button class="correction-toggle" data-idx="${idx}" aria-label="Toggle explanation" title="Show explanation">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                </div>
                <div class="correction-explanation" id="correction-exp-${idx}">${escapeHtml(explanation)}</div>
            `;

            // Toggle explanation
            const toggleBtn = li.querySelector('.correction-toggle');
            const expDiv    = li.querySelector('.correction-explanation');

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBtn.classList.toggle('open');
                expDiv.classList.toggle('visible');
            });

            // Click on item also toggles
            li.addEventListener('click', () => {
                toggleBtn.classList.toggle('open');
                expDiv.classList.toggle('visible');
            });

            dom.correctionsList.appendChild(li);
        });
    }

    // ============================================================
    //  CLIPBOARD
    // ============================================================

    async function copyToClipboard() {
        if (!correctedText) {
            showToast('No corrected text to copy.', 'warning');
            return;
        }
        try {
            await navigator.clipboard.writeText(correctedText);
            showToast('Copied to clipboard!', 'success');
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = correctedText;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Copied to clipboard!', 'success');
        }
    }

    // ============================================================
    //  HISTORY
    // ============================================================

    function toggleHistory() {
        const sidebar = dom.historySidebar;
        const isOpen  = sidebar.classList.contains('open');

        if (isOpen) {
            sidebar.classList.remove('open');
            dom.appWrapper.classList.remove('sidebar-open');
        } else {
            sidebar.classList.add('open');
            dom.appWrapper.classList.add('sidebar-open');
            loadHistory();
        }
    }

    async function loadHistory() {
        try {
            const res  = await fetch(`${DJANGO_API}/history/`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const items = data.results || data.history || data || [];

            if (!Array.isArray(items) || items.length === 0) {
                dom.historyList.innerHTML = '';
                dom.historyEmpty.style.display = 'flex';
                return;
            }

            dom.historyEmpty.style.display = 'none';
            dom.historyList.innerHTML = '';

            items.forEach((entry) => {
                const li = document.createElement('li');
                li.className = 'history-item';

                const textPreview = entry.text || entry.original_text || entry.input || '';
                const date = entry.created_at || entry.date || entry.timestamp || '';
                const formattedDate = date ? new Date(date).toLocaleString() : '';

                li.innerHTML = `
                    <div class="history-item-text">${escapeHtml(textPreview.slice(0, 120))}${textPreview.length > 120 ? '…' : ''}</div>
                    ${formattedDate ? `<div class="history-item-meta">${formattedDate}</div>` : ''}
                `;

                // Clicking history item loads its text
                li.addEventListener('click', () => {
                    dom.textInput.value = textPreview;
                    updateWordCount();
                    toggleHistory();
                    showToast('Text loaded from history.', 'info');
                });

                dom.historyList.appendChild(li);
            });
        } catch (err) {
            dom.historyList.innerHTML = '';
            dom.historyEmpty.style.display = 'flex';
            // Silently fail — history is optional
            console.warn('Could not load history:', err.message);
        }
    }

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================

    function bindEvents() {
        // Theme
        dom.btnToggleDarkMode.addEventListener('click', toggleDarkMode);

        // Toolbar
        dom.btnGrammar.addEventListener('click', checkGrammar);
        dom.btnSpelling.addEventListener('click', checkSpelling);
        dom.btnClarity.addEventListener('click', improveClarity);
        dom.btnReadability.addEventListener('click', analyzeReadability);
        dom.btnFullCheck.addEventListener('click', fullCheck);

        // Copy
        dom.btnCopy.addEventListener('click', copyToClipboard);

        // History
        dom.btnToggleHistory.addEventListener('click', toggleHistory);
        dom.btnCloseHistory.addEventListener('click', toggleHistory);

        // Live word count
        dom.textInput.addEventListener('input', updateWordCount);

        // Keyboard shortcut: Ctrl+Enter = Full Check
        dom.textInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                fullCheck();
            }
        });
    }

    // ============================================================
    //  INITIALISE
    // ============================================================

    function init() {
        initTheme();
        bindEvents();
        updateWordCount();
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

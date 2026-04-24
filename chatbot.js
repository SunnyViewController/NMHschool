// chatbot.js

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function () {
	const toggleBtn = document.getElementById('chatbotToggleBtn');
	const closeBtn = document.getElementById('chatbotCloseBtn');
	const chatbotWindow = document.getElementById('chatbotWindow');
	const sendBtn = document.getElementById('chatbotSendBtn');
	const chatbotInput = document.getElementById('chatbotInput');
	const chatbotMessages = document.getElementById('chatbotMessages');
	const quickBtns = document.querySelectorAll('.quick-btn');

	let conversationMemory = [];

	const aiAvatarUrl = 'AI_assistant.png';
	const userAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

	if (window.innerWidth <= 600) {
		chatbotWindow.classList.add('initial-position');
	}

	toggleBtn.addEventListener('click', function () {
		if (chatbotWindow.style.display === 'flex') {
			chatbotWindow.style.display = 'none';
			closeMediaPanel();
		} else {
			chatbotWindow.style.display = 'flex';
			if (window.innerWidth > 600) chatbotInput.focus();
		}
	});

	document.addEventListener('click', function (event) {
		if (window.innerWidth <= 600) {
			if (document.activeElement === chatbotInput &&
				!chatbotInput.contains(event.target) &&
				!chatbotWindow.contains(event.target) &&
				chatbotWindow.style.display === 'flex') {
				chatbotInput.blur();
			}
		}
	});

	closeBtn.addEventListener('click', function () {
		chatbotWindow.style.display = 'none';
		closeMediaPanel();
	});

	sendBtn.addEventListener('click', sendMessageToBackend);

	chatbotInput.addEventListener('keypress', function (e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessageToBackend();
		}
	});

	chatbotInput.addEventListener('focus', function () {
		if (window.innerWidth <= 600) chatbotWindow.style.position = 'fixed';
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth > 600) {
			chatbotWindow.style.cssText = '';
			chatbotWindow.classList.remove('initial-position');
		} else {
			if (!chatbotWindow.classList.contains('initial-position')) {
				chatbotWindow.classList.add('initial-position');
			}
		}
	});

	// ================================================
	// 유틸리티
	// ================================================

	function getCurrentTime() {
		return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
	}

	function extractImageUrls(text) {
		const urls = [];
		const mdRegex = /!\[.*?\]\((.*?)\)/g;
		let match;
		while ((match = mdRegex.exec(text)) !== null) urls.push(match[1]);
		const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
		while ((match = urlRegex.exec(text)) !== null) {
			if (!urls.includes(match[0])) urls.push(match[0]);
		}
		return urls;
	}

	function extractVideoUrls(text) {
		const urls = [];
		const mdRegex = /\[.*?\]\((.*?\.(mp4|mov|webm|avi))\)/gi;
		let match;
		while ((match = mdRegex.exec(text)) !== null) urls.push(match[1]);
		const urlRegex = /(https?:\/\/[^\s]+\.(mp4|mov|webm|avi))/gi;
		while ((match = urlRegex.exec(text)) !== null) {
			if (!urls.includes(match[0])) urls.push(match[0]);
		}
		return urls;
	}

	function getVideoType(url) {
		if (url.endsWith('.mp4')) return 'mp4';
		if (url.endsWith('.mov')) return 'mov';
		if (url.endsWith('.webm')) return 'webm';
		if (url.endsWith('.avi')) return 'avi';
		return 'mp4';
	}

	// ================================================
	// 미디어 패널
	// ================================================

	function openMediaPanel(mediaItems) {
		const panel = document.getElementById('mediaSlidePanel');
		const content = document.getElementById('mediaPanelContent');
		content.innerHTML = '';
		mediaItems.forEach(item => {
			if (item.type === 'image') {
				const img = document.createElement('img');
				img.src = item.url;
				img.alt = item.title;
				img.loading = 'lazy';
				content.appendChild(img);
			} else if (item.type === 'video') {
				const video = document.createElement('video');
				video.controls = true;
				video.preload = 'metadata';
				const source = document.createElement('source');
				source.src = item.url;
				source.type = `video/${getVideoType(item.url)}`;
				video.appendChild(source);
				content.appendChild(video);
			}
		});
		panel.style.display = 'block';
		document.getElementById('chatbotWindow').classList.add('has-panel');
	}

	function closeMediaPanel() {
		const panel = document.getElementById('mediaSlidePanel');
		panel.style.display = 'none';
		document.getElementById('chatbotWindow').classList.remove('has-panel');
	}

	// ================================================
	// 마크다운 변환
	// ================================================

	function formatMarkdown(text) {
		if (!text) return '';
		let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
		formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
		formatted = formatted.replace(/## (.*?)(\n|$)/g, '<h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">$1</h3>');
		formatted = formatted.replace(/# (.*?)(\n|$)/g, '<h2 style="margin:0 0 10px;font-size:18px;font-weight:600;">$1</h2>');
		formatted = formatted.replace(/^- (.*?)(\n|$)/gm, '<li style="margin-left:15px;margin-bottom:4px;">$1</li>');
		formatted = formatted.replace(/^(\d+)\. (.*?)(\n|$)/gm, '<li style="margin-left:15px;margin-bottom:4px;">$2</li>');
		formatted = formatted.replace(/\n\n/g, '<br><br>');
		formatted = formatted.replace(/\n/g, '<br>');
		if (formatted.includes('<li>')) formatted = '<ul style="margin:8px 0;padding-left:20px;">' + formatted + '</ul>';
		return formatted;
	}

	// ================================================
	// 메시지 추가
	// ================================================

	function addMessage(text, sender) {
		const container = document.createElement('div');
		container.className = `message-container ${sender}-container`;

		if (sender === 'bot') {
			const av = document.createElement('div');
			av.className = 'avatar-container';
			const img = document.createElement('img');
			img.src = aiAvatarUrl;
			img.alt = 'AI';
			img.className = 'avatar-img';
			av.appendChild(img);
			container.appendChild(av);
		}

		const content = document.createElement('div');
		content.className = 'message-content-wrapper';

		const bubble = document.createElement('div');
		bubble.className = `chatbot-message ${sender}-message`;
		bubble.innerHTML = formatMarkdown(text);
		content.appendChild(bubble);

		// 자동 미디어 패널 열기
		if (sender === 'bot') {
			const images = extractImageUrls(text);
			const videos = extractVideoUrls(text);
			const items = [
				...images.map(u => ({ type: 'image', url: u, title: 'Photo' })),
				...videos.map(u => ({ type: 'video', url: u, title: 'Video' }))
			];
			if (items.length > 0) openMediaPanel(items);
		}

		const time = document.createElement('div');
		time.className = 'message-time';
		time.textContent = getCurrentTime();
		content.appendChild(time);
		container.appendChild(content);

		if (sender === 'user') {
			const ua = document.createElement('div');
			ua.className = 'avatar-container user-avatar';
			const ui = document.createElement('img');
			ui.src = userAvatarUrl;
			ui.alt = 'You';
			ui.className = 'avatar-img';
			ua.appendChild(ui);
			container.appendChild(ua);
		}

		chatbotMessages.appendChild(container);
		conversationMemory.push({ role: sender === 'user' ? 'user' : 'assistant', content: text, timestamp: new Date().toISOString() });
		if (conversationMemory.length > 15) conversationMemory = conversationMemory.slice(-15);
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	// ================================================
	// 메시지 전송
	// ================================================

	async function sendMessageToBackend() {
		const message = chatbotInput.value.trim();
		if (!message) return;

		addMessage(message, 'user');
		chatbotInput.value = '';

		// 로딩
		const loadContainer = document.createElement('div');
		loadContainer.className = 'message-container bot-container';
		const loadAvatar = document.createElement('div');
		loadAvatar.className = 'avatar-container';
		const lai = document.createElement('img');
		lai.src = aiAvatarUrl;
		lai.alt = 'AI';
		lai.className = 'avatar-img';
		loadAvatar.appendChild(lai);
		loadContainer.appendChild(loadAvatar);
		const loadContent = document.createElement('div');
		loadContent.className = 'message-content-wrapper';
		const loadDiv = document.createElement('div');
		loadDiv.className = 'chatbot-message bot-message loading-message';
		loadDiv.innerHTML = '<div class="wave-dots"><div class="wave-dot"></div><div class="wave-dot"></div><div class="wave-dot"></div></div>';
		loadContent.appendChild(loadDiv);
		loadContainer.appendChild(loadContent);
		chatbotMessages.appendChild(loadContainer);
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

		const requestData = {
			message: message,
			school_id: "2ZQLb1N7bafnESAPXauOIL2y0m03",
			user_id: "anonymous",
			history: conversationMemory.slice(-10)
		};

		try {
			const response = await fetch('https://chat-stream-gmq4inexiq-uc.a.run.app/chat_stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestData)
			});

			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			loadContainer.remove();

			const respContainer = document.createElement('div');
			respContainer.className = 'message-container bot-container';
			const respAvatar = document.createElement('div');
			respAvatar.className = 'avatar-container';
			const rai = document.createElement('img');
			rai.src = aiAvatarUrl;
			rai.alt = 'AI';
			rai.className = 'avatar-img';
			respAvatar.appendChild(rai);
			respContainer.appendChild(respAvatar);

			const respContent = document.createElement('div');
			respContent.className = 'message-content-wrapper';
			const respDiv = document.createElement('div');
			respDiv.className = 'chatbot-message bot-message';
			respContent.appendChild(respDiv);
			const respTime = document.createElement('div');
			respTime.className = 'message-time';
			respTime.textContent = getCurrentTime();
			respContent.appendChild(respTime);
			respContainer.appendChild(respContent);
			chatbotMessages.appendChild(respContainer);

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '', fullResponse = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					conversationMemory.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
					if (conversationMemory.length > 15) conversationMemory = conversationMemory.slice(-15);
					// 마지막 미디어 업데이트
					const imgs = extractImageUrls(fullResponse);
					const vids = extractVideoUrls(fullResponse);
					const items = [...imgs.map(u => ({ type: 'image', url: u, title: 'Photo' })), ...vids.map(u => ({ type: 'video', url: u, title: 'Video' }))];
					if (items.length > 0) openMediaPanel(items);
					if (window.innerWidth > 600) chatbotInput.focus();
					break;
				}
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';
				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;
					try {
						const d = JSON.parse(line.substring(6));
						if (d.type === 'chunk' && d.content) {
							fullResponse += d.content;
							respDiv.innerHTML = formatMarkdown(fullResponse);
							chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
						} else if (d.type === 'error') {
							respDiv.textContent = `Error: ${d.content}`;
							reader.cancel();
							return;
						}
					} catch (e) { /* parse error */ }
				}
			}
		} catch (error) {
			console.error('Fetch error:', error);
			loadContainer.remove();
			const errContainer = document.createElement('div');
			errContainer.className = 'message-container bot-container';
			const errAvatar = document.createElement('div');
			errAvatar.className = 'avatar-container';
			const eai = document.createElement('img');
			eai.src = aiAvatarUrl;
			eai.alt = 'AI';
			eai.className = 'avatar-img';
			errAvatar.appendChild(eai);
			errContainer.appendChild(errAvatar);
			const errContent = document.createElement('div');
			errContent.className = 'message-content-wrapper';
			const errDiv = document.createElement('div');
			errDiv.className = 'chatbot-message bot-message error-message';
			errDiv.textContent = 'A connection error has occurred, please try again.';
			errContent.appendChild(errDiv);
			errContainer.appendChild(errContent);
			chatbotMessages.appendChild(errContainer);
			chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
		}

		if (window.innerWidth <= 600) chatbotInput.blur();
		else chatbotInput.focus();
	}

	// ================================================
	// 웰컴 메시지
	// ================================================

	function showWelcomeMessage() {
		const wc = document.createElement('div');
		wc.className = 'message-container bot-container';
		const wa = document.createElement('div');
		wa.className = 'avatar-container';
		const wi = document.createElement('img');
		wi.src = aiAvatarUrl;
		wi.alt = 'AI';
		wi.className = 'avatar-img';
		wa.appendChild(wi);
		wc.appendChild(wa);
		const wm = document.createElement('div');
		wm.className = 'message-content-wrapper';
		const wb = document.createElement('div');
		wb.className = 'chatbot-message bot-message';
		wb.innerHTML = formatMarkdown("Welcome to **Northfield Mount Hermon**. I'm your **NMH AI assistant**. What can I help you with today?");
		wm.appendChild(wb);
		const wt = document.createElement('div');
		wt.className = 'message-time';
		wt.textContent = getCurrentTime();
		wm.appendChild(wt);
		wc.appendChild(wm);
		chatbotMessages.appendChild(wc);
		showQuickQuestions();
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	function showQuickQuestions() {
		const qq = document.createElement('div');
		qq.className = 'quick-questions';
		qq.innerHTML = `
			<div class="quick-questions-title">Quick questions:</div>
			<button class="quick-btn" data-question="Can you tell me how I can get to NMH?">🚗 How to get to NMH</button>
			<button class="quick-btn" data-question="What is the application process? What documents do I need to complete and submit, and what is the deadline?">📝 Application Process</button>
			<button class="quick-btn" data-question="What are the key school events taking place this month?">📅 Events</button>
			<button class="quick-btn" data-question="What facilities does NMH have?">🏫 School Facilities</button>`;
		chatbotMessages.appendChild(qq);
		qq.querySelectorAll('.quick-btn').forEach(btn => {
			btn.addEventListener('click', function () {
				chatbotInput.value = this.getAttribute('data-question');
				sendMessageToBackend();
			});
		});
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	chatbotWindow.style.display = 'none';
	setTimeout(showWelcomeMessage, 1000);
});

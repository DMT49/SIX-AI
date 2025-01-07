document.addEventListener("DOMContentLoaded", () => {
  console.log("Chatbot initialized.");

  // -----------------------------
  // Name and Email Variables (from WordPress)
  // -----------------------------
  const email = '%%EMAIL%%';
  const name = '%%FIRST_NAME%%';

  // Configuration for AI agent
  const region = "bcbe5a"; // Replace with your region
  const projectId = "c5bf489c1af9-4886-afba-073965a5ad71"; // Replace with your project ID
  const apiKey = "sk-MGJlOWM0NGEtMjgyNC00MTIwLTg5NGUtN2IwMzljMmNjNDgx"; // Replace with your API key
  const agentId = "6a12b1cd-b7d5-4b00-80ee-d2829af810dc"; // Replace with your agent ID

  // Use base64 encoding for the authorization token
  const authorizationToken = `Basic ${btoa(`${projectId}:${apiKey}`)}`;
  const baseUrl = `https://api-${region}.stack.tryrelevance.com/latest`;
  const headers = {
    Authorization: authorizationToken,
    "Content-Type": "application/json",
  };

  // DOM elements
  const textarea = document.getElementById("chat-user-input");
  const micButton = document.getElementById("chat-user-input-mic");
  const userSubmit = document.getElementById("chat-user-submit");
  const hiddenDiv = document.getElementById("hidden-div");
  const conversationWrapper = document.getElementById("chat_conversation-wrapper");
  const chatInputWrapper = document.querySelector(".chat_input-wrapper");

  // -----------------------------
  // Hide input UI on load
  // -----------------------------
  if (chatInputWrapper) {
    chatInputWrapper.style.display = "none";
    console.log("Input wrapper hidden on load.");
  } else {
    console.error("Cannot find .chat_input-wrapper element.");
  }

  let conversationId = null;
  let isListening = false;
  let retainedText = "";

  // Function to dynamically adjust textarea height
  function adjustHeight() {
    hiddenDiv.textContent = textarea.value + "\u200b";
    textarea.style.height = hiddenDiv.offsetHeight + "px";
  }

  // Function to reset the textarea height and content
  function resetHeight() {
    textarea.value = "";
    textarea.style.height = "30px";
    hiddenDiv.textContent = "\u200b";
  }

  // Function to stop voice transcription
  function stopVoiceTranscription() {
    if (isListening) {
      recognition.stop();
      micButton.classList.remove("is-active");
      console.log("Voice transcription stopped.");
      isListening = false;
    }
    retainedText = "";
  }

  // Function to create a chat block (user or bot)
  function createChatBlock(isUser, content) {
    const segments = [];
    const regex = /(\{[\s\S]*?\})/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = content.substring(lastIndex, match.index);
        segments.push({ type: "text", content: textSegment });
      }
      segments.push({ type: "option", content: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      const textSegment = content.substring(lastIndex);
      segments.push({ type: "text", content: textSegment });
    }

    let optionGroup = [];
    let lastOptionIndex = -1;
    let hasRenderedBotAvatar = false;

    segments.forEach((segment, index) => {
      if (segment.type === "text") {
        const textContent = segment.content.trim();
        if (textContent) {
          if (optionGroup.length > 0) {
            const isOptionsAtEnd = !hasNonEmptyTextAfterIndex(segments, lastOptionIndex);
            renderOptions(optionGroup, isOptionsAtEnd);
            optionGroup = [];
          }
          const hideAvatar = !isUser && hasRenderedBotAvatar;
          renderTextSegment(textContent, isUser, hideAvatar);
          hasRenderedBotAvatar = true;
        }
      } else if (segment.type === "option") {
        optionGroup.push(cleanOptionText(segment.content.slice(1, -1).trim()));
        lastOptionIndex = index;
      }
    });

    if (optionGroup.length > 0) {
      const isOptionsAtEnd = !hasNonEmptyTextAfterIndex(segments, lastOptionIndex);
      renderOptions(optionGroup, isOptionsAtEnd);
      optionGroup = [];
    }

    conversationWrapper.scrollTop = conversationWrapper.scrollHeight;
  }

  // Helper function to check if there's non-empty text after a given index
  function hasNonEmptyTextAfterIndex(segments, currentIndex) {
    for (let i = currentIndex + 1; i < segments.length; i++) {
      if (segments[i].type === "text" && segments[i].content.trim()) {
        return true;
      }
    }
    return false;
  }

  // Function to render text segments
  function renderTextSegment(text, isUser, hideAvatar) {
    if (!text) return;
    const chatBlockWrapper = document.createElement("div");
    chatBlockWrapper.className = "chat_block-wrapper";

    const chatBlock = document.createElement("div");
    chatBlock.className = "chat_block";

    const botAvatar = document.createElement("div");
    botAvatar.className = "chat_bot-avatar";
    if (isUser || hideAvatar) botAvatar.classList.add("opacity-0");

    const userAvatar = document.createElement("div");
    userAvatar.className = "chat_user-avatar";
    if (!isUser) userAvatar.classList.add("opacity-0");

    const chatInnerWrapper = document.createElement("div");
    chatInnerWrapper.className = `chat_inner-wrapper ${isUser ? "user-message" : ""}`;

    chatInnerWrapper.textContent = text;

    chatBlock.appendChild(botAvatar);
    chatBlock.appendChild(chatInnerWrapper);
    chatBlock.appendChild(userAvatar);

    chatBlockWrapper.appendChild(chatBlock);
    conversationWrapper.appendChild(chatBlockWrapper);
  }

  // Function to render multiple choice options
  function renderOptions(options, isEnd) {
    if (options.length === 0) return;

    const chatBlockWrapper = document.createElement("div");
    chatBlockWrapper.className = "chat_block-wrapper is-multi-choice-options";
    if (isEnd) {
      chatBlockWrapper.classList.add("is-end");
    }

    const chatBlock = document.createElement("div");
    chatBlock.className = "chat_block is-multi-choice-options";

    let optionClicked = false;

    options.forEach((optionText) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "chat_multi-choice-option";

      const optionHeading = document.createElement("h3");
      optionHeading.className = "chat-button-text";
      optionHeading.textContent = optionText;

      optionDiv.appendChild(optionHeading);
      chatBlock.appendChild(optionDiv);

      // Handle option click
      optionDiv.addEventListener("click", async () => {
        if (optionClicked) return;
        optionDiv.classList.add("is-chosen");
        optionClicked = true;
        Array.from(chatBlock.children).forEach((child) => {
          if (child !== optionDiv) {
            child.classList.add("is-disabled");
            child.style.pointerEvents = "none";
          }
        });
        // Show the user's chosen option as their message
        createChatBlock(true, optionText);
        // Create loading block
        const { chatInnerWrapper: loadingWrapper, chatBlockWrapper: loadingBlockWrapper } = createLoadingBlock();
        // Get response
        const agentResponse = await startConversation(optionText);
        // Remove loading block
        conversationWrapper.removeChild(loadingBlockWrapper);
        // Show agent response
        createChatBlock(false, agentResponse);
      });
    });

    chatBlockWrapper.appendChild(chatBlock);
    conversationWrapper.appendChild(chatBlockWrapper);
  }

  // Function to clean option text
  function cleanOptionText(text) {
    text = text.replace(/^[\s]*([-*]|(\d+\.)|(\d+\))|[A-Z]\.)\s*/, "");
    text = text.replace(/[*#_`~>-]/g, "");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }

  // Function to start a conversation with the AI
  async function startConversation(message) {
    try {
      const requestBody = {
        message: { role: "user", content: message },
        agent_id: agentId,
        ...(conversationId && { conversation_id: conversationId }),
      };

      const response = await fetch(`${baseUrl}/agents/trigger`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        if (!conversationId) {
          conversationId = data.conversation_id;
          console.log(`New conversation started with ID: ${conversationId}`);
        }
        const { studio_id, job_id } = data.job_info;
        const agentResponse = await pollAgentResponse(studio_id, job_id);
        return agentResponse;
      } else {
        const errorData = await response.json();
        console.error("Error starting conversation:", errorData);
        return `Sorry, something went wrong: ${errorData.message || response.statusText}`;
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      return "Sorry, something went wrong.";
    }
  }

  // Function to poll the AI for a response
  async function pollAgentResponse(studio_id, job_id) {
    const pollUrl = `${baseUrl}/studios/${studio_id}/async_poll/${job_id}`;
    let done = false;

    while (!done) {
      try {
        const response = await fetch(pollUrl, { method: "GET", headers: headers });
        if (response.ok) {
          const data = await response.json();
          for (const update of data.updates) {
            if (update.type === "chain-success" && update.output.status === "complete") {
              done = true;
              return update.output.output.answer;
            }
          }
        } else {
          console.error("Error during polling:", response.statusText);
          return "Sorry, something went wrong while waiting for the response.";
        }
      } catch (error) {
        console.error("Error during polling:", error);
        return "Sorry, something went wrong while waiting for the response.";
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Function to create a loading block
  function createLoadingBlock() {
    const chatBlockWrapper = document.createElement("div");
    chatBlockWrapper.className = "chat_block-wrapper";

    const chatBlock = document.createElement("div");
    chatBlock.className = "chat_block";

    const botAvatar = document.createElement("div");
    botAvatar.className = "chat_bot-avatar";

    const chatInnerWrapper = document.createElement("div");
    chatInnerWrapper.className = "chat_inner-wrapper";

    // Create the loading animation container
    const loadAnimationContainer = document.createElement("div");
    loadAnimationContainer.className = "load-animation";

    // Use the GIF instead of a lottie
    const gifImage = document.createElement("img");
    gifImage.src = "https://cdn.prod.website-files.com/64e508e8bea103fa08b8f130/6761f50a16ce8196496d4724_load-animation.gif";
    gifImage.alt = "Loading...";
    loadAnimationContainer.appendChild(gifImage);

    chatInnerWrapper.appendChild(loadAnimationContainer);
    chatBlock.appendChild(botAvatar);
    chatBlock.appendChild(chatInnerWrapper);
    chatBlockWrapper.appendChild(chatBlock);
    conversationWrapper.appendChild(chatBlockWrapper);
    conversationWrapper.scrollTop = conversationWrapper.scrollHeight;

    return { chatInnerWrapper, chatBlockWrapper };
  }

  // -----------------------------
  // Initialize AI Agent
  // -----------------------------
  function initializeAgent() {
    console.log("Initializing AI agent...");
    startInitialConversation();
  }

  // -----------------------------
  // Automatically Start Conversation
  // -----------------------------
  async function startInitialConversation() {
    // Create loading block
    const { chatInnerWrapper, chatBlockWrapper } = createLoadingBlock();

    // Construct the initial message
    const currentTime = new Date().toLocaleString();
    const initialMessage = `conversation_name=${currentTime}, current_username=${name}, current_user_email=${email}`;

    console.log("Sending initial message to AI:", initialMessage);

    // Send initial message to AI (not shown as user's message)
    const agentResponse = await startConversation(initialMessage);

    // Remove loading block
    conversationWrapper.removeChild(chatBlockWrapper);

    // Display only the AI's response
    createChatBlock(false, agentResponse);

    // Now show the input UI so the user can continue
    if (chatInputWrapper) {
      chatInputWrapper.style.display = "grid"; // Changed from "block" to "grid"
      console.log("Input wrapper displayed as grid.");
    }
  }

  // Call initializeAgent to start everything
  initializeAgent();
});

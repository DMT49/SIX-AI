// Main initialization function
function initializeAgent() {
  console.log('Initializing AI agent...');

  // Re-select all DOM elements after HTML is loaded
  const textarea = document.getElementById("chat-user-input");
  const micButton = document.getElementById("chat-user-input-mic");
  const userSubmit = document.getElementById("chat-user-submit");
  const hiddenDiv = document.getElementById("hidden-div");
  const conversationWrapper = document.getElementById("chat_conversation-wrapper");
  const chatInputWrapper = document.querySelector(".chat_input-wrapper");

  // Check if all required elements are present
  if (!textarea || !micButton || !userSubmit || !hiddenDiv || !conversationWrapper || !chatInputWrapper) {
    console.error("Some DOM elements are missing. Cannot initialize.");
    return;
  }

  // Attach event listeners
  textarea.addEventListener("input", adjustHeight);
  userSubmit.addEventListener("click", handleSubmit);
  console.log("Event listeners attached.");

  // Sync styles
  syncStyles();
  textarea.style.height = "30px";

  // Start initial conversation
  startInitialConversation();
}

// Event listener to initialize when HTML is fully loaded
document.addEventListener("DOMContentLoaded", initializeAgent);

// Helper functions and chatbot logic

// Function to dynamically adjust textarea height
function adjustHeight() {
  const hiddenDiv = document.getElementById("hidden-div");
  const textarea = document.getElementById("chat-user-input");
  hiddenDiv.textContent = textarea.value + "\u200b";
  textarea.style.height = hiddenDiv.offsetHeight + "px";
}

// Sync styles from textarea to hidden div (initial setup)
function syncStyles() {
  const textarea = document.getElementById("chat-user-input");
  const hiddenDiv = document.getElementById("hidden-div");
  const computedStyles = getComputedStyle(textarea);
  hiddenDiv.style.width = computedStyles.width;
  hiddenDiv.style.lineHeight = computedStyles.lineHeight;
  hiddenDiv.style.padding = computedStyles.padding;
  hiddenDiv.style.boxSizing = computedStyles.boxSizing;
}

// Function to reset the textarea height and content
function resetHeight() {
  const textarea = document.getElementById("chat-user-input");
  const hiddenDiv = document.getElementById("hidden-div");
  textarea.value = "";
  textarea.style.height = "30px";
  hiddenDiv.textContent = "\u200b";
}

// Function to start the initial conversation with the AI
async function startInitialConversation() {
  const chatInputWrapper = document.querySelector(".chat_input-wrapper");
  const conversationWrapper = document.getElementById("chat_conversation-wrapper");

  // Create loading block
  const { chatBlockWrapper } = createLoadingBlock();

  // Construct the initial message
  const email = '%%EMAIL%%'; // Replace with actual email if needed
  const name = '%%FIRST_NAME%%'; // Replace with actual name if needed
  const currentTime = new Date().toLocaleString();
  const initialMessage = `conversation_name=${currentTime}, current_username=${name}, current_user_email=${email}`;

  console.log("Sending initial message to AI:", initialMessage);

  // Send initial message to AI
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

// Function to start a conversation with the AI
async function startConversation(message) {
  const region = "bcbe5a"; // Replace with your region
  const projectId = "c5bf489c1af9-4886-afba-073965a5ad71"; // Replace with your project ID
  const apiKey = "sk-MGJlOWM0NGEtMjgyNC00MTIwLTg5NGUtN2IwMzljMmNjNDgx"; // Replace with your API key
  const agentId = "6a12b1cd-b7d5-4b00-80ee-d2829af810dc"; // Replace with your agent ID

  const authorizationToken = `Basic ${btoa(`${projectId}:${apiKey}`)}`;
  const baseUrl = `https://api-${region}.stack.tryrelevance.com/latest`;
  const headers = {
    Authorization: authorizationToken,
    "Content-Type": "application/json",
  };

  let conversationId = null;

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
      return await pollAgentResponse(studio_id, job_id);
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
  const baseUrl = `https://api-bcbe5a.stack.tryrelevance.com/latest`;
  const pollUrl = `${baseUrl}/studios/${studio_id}/async_poll/${job_id}`;
  const headers = {
    Authorization: `Basic ${btoa("c5bf489c1af9-4886-afba-073965a5ad71:sk-MGJlOWM0NGEtMjgyNC00MTIwLTg5NGUtN2IwMzljMmNjNDgx")}`,
    "Content-Type": "application/json",
  };

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

  const loadAnimationContainer = document.createElement("div");
  loadAnimationContainer.className = "load-animation";

  const gifImage = document.createElement("img");
  gifImage.src = "https://cdn.prod.website-files.com/64e508e8bea103fa08b8f130/6761f50a16ce8196496d4724_load-animation.gif";
  gifImage.alt = "Loading...";

  loadAnimationContainer.appendChild(gifImage);
  chatInnerWrapper.appendChild(loadAnimationContainer);
  chatBlock.appendChild(botAvatar);
  chatBlock.appendChild(chatInnerWrapper);
  chatBlockWrapper.appendChild(chatBlock);

  document.getElementById("chat_conversation-wrapper").appendChild(chatBlockWrapper);
  return { chatInnerWrapper, chatBlockWrapper };
}

// Function to create a chat block (user or bot)
function createChatBlock(isUser, content) {
  const conversationWrapper = document.getElementById("chat_conversation-wrapper");
  const chatBlockWrapper = document.createElement("div");
  chatBlockWrapper.className = "chat_block-wrapper";

  const chatBlock = document.createElement("div");
  chatBlock.className = "chat_block";

  const botAvatar = document.createElement("div");
  botAvatar.className = "chat_bot-avatar";
  if (isUser) botAvatar.classList.add("opacity-0");

  const userAvatar = document.createElement("div");
  userAvatar.className = "chat_user-avatar";
  if (!isUser) userAvatar.classList.add("opacity-0");

  const chatInnerWrapper = document.createElement("div");
  chatInnerWrapper.className = `chat_inner-wrapper ${isUser ? "user-message" : ""}`;
  chatInnerWrapper.innerText = content;

  chatBlock.appendChild(botAvatar);
  chatBlock.appendChild(chatInnerWrapper);
  chatBlock.appendChild(userAvatar);
  chatBlockWrapper.appendChild(chatBlock);
  conversationWrapper.appendChild(chatBlockWrapper);
}

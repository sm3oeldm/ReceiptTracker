import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { chatWithAssistant } from '../services/api';

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What's my most expensive category?",
  "Where did I buy the cheapest groceries?"
];

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 200);
    const anim3 = animate(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const getOpacity = (anim) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  });

  return (
    <View style={styles.typingDots}>
      <Animated.Text style={[styles.dot, getOpacity(dot1)]}>●</Animated.Text>
      <Animated.Text style={[styles.dot, getOpacity(dot2)]}>●</Animated.Text>
      <Animated.Text style={[styles.dot, getOpacity(dot3)]}>●</Animated.Text>
    </View>
  );
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  const scrollViewRef = useRef(null);

  // Track if voice is available (not in Expo Go)
  useEffect(() => {
    let isMounted = true;
    const checkVoice = async () => {
      try {
        const Voice = require('@react-native-voice/voice').default;
        if (Voice) {
          setVoiceAvailable(true);
        }
      } catch {
        if (isMounted) setVoiceAvailable(false);
      }
    };
    checkVoice();
    return () => { isMounted = false; };
  }, []);

  // Welcome message on first mount
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm your spending assistant 👋 I have access to all your receipts and can answer questions like:\n- Where did you buy the cheapest milk?\n- How much did you spend on groceries this month?\n- Who in the family spends the most on fast food?\n\nAsk me anything about your spending!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Voice input setup
  useEffect(() => {
    let Voice;
    try {
      Voice = require('@react-native-voice/voice').default;
    } catch {
      return;
    }

    Voice.onSpeechResults = (e) => {
      const transcript = e.value?.[0] || '';
      setInputText(transcript);
      setIsListening(false);
    };

    Voice.onSpeechError = () => setIsListening(false);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setHasSentMessage(true);

    // Build conversation history for API (exclude welcome message, exclude id/timestamp fields)
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => !m.isWelcome)
      .map(m => ({ role: m.role, content: m.text }));

    try {
      const response = await chatWithAssistant(text.trim(), history);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Sorry, I couldn't reach the server. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Speech.stop();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm your spending assistant 👋 I have access to all your receipts and can answer questions like:\n- Where did you buy the cheapest milk?\n- How much did you spend on groceries this month?\n- Who in the family spends the most on fast food?\n\nAsk me anything about your spending!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isWelcome: true,
      },
    ]);
    setHasSentMessage(false);
  };

  const readAloud = (text) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const startListening = async () => {
    try {
      const Voice = require('@react-native-voice/voice').default;
      setInputText('');
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      const Voice = require('@react-native-voice/voice').default;
      await Voice.stop();
      setIsListening(false);
    } catch {
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSuggestionTap = (text) => {
    setInputText(text);
  };

  const renderMessageBubble = (msg) => {
    const isUser = msg.role === 'user';
    const isAssistant = msg.role === 'assistant';

    return (
      <View key={msg.id} style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            msg.isError && styles.errorBubble,
          ]}
        >
          <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.assistantBubbleText]}>
            {msg.text}
          </Text>
          {isAssistant && !msg.isWelcome && (
            <TouchableOpacity
              style={styles.readAloudButton}
              onPress={() => readAloud(msg.text)}
            >
              <Ionicons
                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={16}
                color="#6B7280"
              />
              <Text style={styles.readAloudText}>Read aloud</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {msg.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assistant</Text>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessageBubble)}

        {/* Loading indicator */}
        {isLoading && (
          <View key="loading" style={[styles.bubbleRow, styles.assistantRow]}>
            <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
              <TypingDots />
            </View>
          </View>
        )}

        {/* Suggestion chips — only show before first message */}
        {!hasSentMessage && (
          <View style={styles.suggestionsContainer}>
            {SUGGESTIONS.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionTap(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Voice/Speaking status bar */}
      {(isListening || isSpeaking) && (
        <View style={styles.voiceStatusBar}>
          {isListening ? (
            <>
              <Text style={styles.voiceStatusText}>🎙️ Listening... (tap mic to stop)</Text>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => {
                Speech.stop();
                setIsSpeaking(false);
              }}
            >
              <Text style={styles.voiceStatusText}>🔊 Speaking... (tap to stop)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputContainer}>
        {voiceAvailable ? (
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={24}
              color={isListening ? '#ef4444' : '#6B7280'}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.micButton} disabled>
            <Ionicons name="mic-off-outline" size={24} color="#D1D5DB" />
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.textInput}
          placeholder="Ask about your spending..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!isLoading && !isListening}
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputText.trim() || isLoading ? '#9CA3AF' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {!voiceAvailable && (
        <Text style={styles.voiceNote}>Voice requires Expo Dev Build</Text>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleRow: {
    marginBottom: 16,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#FEE2E2',
  },
  loadingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  assistantBubbleText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginHorizontal: 4,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  assistantTimestamp: {
    textAlign: 'left',
  },
  readAloudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  readAloudText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    fontSize: 10,
    color: '#6B7280',
    marginRight: 3,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: '#E0F2FE',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '500',
  },
  voiceStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  voiceStatusText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  micButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  voiceNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
});

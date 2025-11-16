import { useState, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  FormControl,
  FormLabel,
  useToast,
  Collapse,
  Divider,
  Badge,
} from '@chakra-ui/react'
import { FiSend, FiSettings, FiTrash2 } from 'react-icons/fi'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getTextConfig, chat, Message } from '../services/textApi'

function TextChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // Settings
  const [maxLength, setMaxLength] = useState(512)
  const [temperature, setTemperature] = useState(0.7)
  const [topP, setTopP] = useState(0.9)
  const [topK, setTopK] = useState(50)
  const [repetitionPenalty, setRepetitionPenalty] = useState(1.1)

  // Fetch config
  const { data: config, isLoading } = useQuery({
    queryKey: ['textConfig'],
    queryFn: getTextConfig,
    onError: () => {
      toast({
        title: 'Failed to load text model',
        description: 'Could not fetch model configuration',
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: chat,
    onSuccess: (data) => {
      setMessages(data.messages)
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.response?.data?.detail || 'An error occurred',
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    chatMutation.mutate({
      messages: newMessages,
      max_length: maxLength,
      temperature,
      top_p: topP,
      top_k: topK,
      repetition_penalty: repetitionPenalty,
    })
  }

  const handleClear = () => {
    setMessages([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading text model...</Text>
      </Box>
    )
  }

  if (!config?.available) {
    return (
      <Box
        bg="gray.800"
        borderRadius="lg"
        p={8}
        textAlign="center"
        borderWidth="1px"
        borderColor="gray.700"
      >
        <VStack spacing={4}>
          <Text fontSize="2xl">⚠️</Text>
          <Text fontSize="lg" fontWeight="bold">
            Text Model Not Available
          </Text>
          <Text color="gray.400">
            Please download the model first using download_models.py
          </Text>
          <Text fontSize="sm" color="gray.500">
            Model: {config?.model_name}
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box h="calc(100vh - 120px)">
      <VStack spacing={4} h="100%" align="stretch">
        {/* Header */}
        <HStack justify="space-between" px={4}>
          <HStack>
            <Text fontSize="xl" fontWeight="bold">
              💬 Text Chat
            </Text>
            <Badge colorScheme="green">{config.model_name}</Badge>
          </HStack>
          <HStack>
            <IconButton
              aria-label="Settings"
              icon={<FiSettings />}
              size="sm"
              variant={showSettings ? 'solid' : 'ghost'}
              onClick={() => setShowSettings(!showSettings)}
            />
            <IconButton
              aria-label="Clear"
              icon={<FiTrash2 />}
              size="sm"
              variant="ghost"
              onClick={handleClear}
              isDisabled={messages.length === 0}
            />
          </HStack>
        </HStack>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Box
            bg="gray.800"
            borderRadius="lg"
            p={4}
            borderWidth="1px"
            borderColor="gray.700"
          >
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" fontWeight="bold">
                Generation Settings
              </Text>

              <FormControl>
                <FormLabel fontSize="xs">Max Length: {maxLength}</FormLabel>
                <Slider
                  value={maxLength}
                  onChange={setMaxLength}
                  min={50}
                  max={2048}
                  step={50}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs">Temperature: {temperature.toFixed(1)}</FormLabel>
                <Slider
                  value={temperature}
                  onChange={setTemperature}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs">Top P: {topP.toFixed(2)}</FormLabel>
                  <Slider value={topP} onChange={setTopP} min={0.1} max={1.0} step={0.05}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">Top K: {topK}</FormLabel>
                  <Slider value={topK} onChange={setTopK} min={1} max={100} step={1}>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="xs">
                  Repetition Penalty: {repetitionPenalty.toFixed(1)}
                </FormLabel>
                <Slider
                  value={repetitionPenalty}
                  onChange={setRepetitionPenalty}
                  min={1.0}
                  max={2.0}
                  step={0.1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
            </VStack>
          </Box>
        </Collapse>

        {/* Messages */}
        <Box
          flex={1}
          overflowY="auto"
          bg="gray.800"
          borderRadius="lg"
          p={4}
          borderWidth="1px"
          borderColor="gray.700"
        >
          {messages.length === 0 ? (
            <VStack spacing={4} justify="center" h="100%">
              <Text fontSize="4xl">💬</Text>
              <Text fontSize="lg" color="gray.400">
                Start a conversation
              </Text>
              <Text fontSize="sm" color="gray.500">
                Type a message below to begin
              </Text>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              {messages.map((msg, index) => (
                <Box key={index}>
                  <HStack align="start" spacing={3}>
                    <Box
                      bg={msg.role === 'user' ? 'blue.600' : 'green.600'}
                      borderRadius="full"
                      w={8}
                      h={8}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="sm">{msg.role === 'user' ? '👤' : '🤖'}</Text>
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="xs" color="gray.400" mb={1}>
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </Text>
                      <Text whiteSpace="pre-wrap">{msg.content}</Text>
                    </Box>
                  </HStack>
                  {index < messages.length - 1 && <Divider my={4} borderColor="gray.700" />}
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>

        {/* Input */}
        <HStack spacing={2}>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            size="sm"
            resize="none"
            rows={3}
            bg="gray.800"
            borderColor="gray.600"
            isDisabled={chatMutation.isLoading}
          />
          <Button
            leftIcon={<FiSend />}
            colorScheme="brand"
            onClick={handleSend}
            isLoading={chatMutation.isLoading}
            isDisabled={!input.trim()}
            h="full"
          >
            Send
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}

export default TextChat

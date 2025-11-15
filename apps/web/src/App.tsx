import { Box, Container, Heading, Text, HStack, Badge, useToast } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { checkHealth } from './services/api'
import ImageGenerator from './components/ImageGenerator'

function App() {
  const toast = useToast()

  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    onError: () => {
      toast({
        title: 'API Connection Error',
        description: 'Could not connect to the backend API',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box bg="gray.800" borderBottom="1px" borderColor="gray.700" py={3}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Heading size="md" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                🎨 Dee Studio
              </Heading>
              <Text color="gray.500" fontSize="sm">
                AI Image Generation
              </Text>
            </HStack>
            {!isLoading && health && (
              <HStack spacing={2}>
                <Badge colorScheme={health.cuda_available ? 'green' : 'yellow'} fontSize="xs">
                  {health.cuda_available ? `${health.gpu_name}` : 'CPU'}
                </Badge>
              </HStack>
            )}
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <ImageGenerator />
      </Container>

      {/* Footer */}
      <Box as="footer" py={6} mt={12} borderTop="1px" borderColor="gray.700">
        <Container maxW="container.xl">
          <Text textAlign="center" color="gray.500" fontSize="sm">
            Powered by Dee Studio • Stable Diffusion XL
          </Text>
        </Container>
      </Box>
    </Box>
  )
}

export default App

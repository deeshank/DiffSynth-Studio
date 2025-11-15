import { Box, Container, Heading, Text, VStack, HStack, Badge, useToast } from '@chakra-ui/react'
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
      <Box bg="gray.800" borderBottom="1px" borderColor="gray.700" py={4}>
        <Container maxW="container.xl">
          <VStack spacing={2} align="start">
            <HStack spacing={4}>
              <Heading size="lg" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                🎨 Dee Studio
              </Heading>
              {!isLoading && health && (
                <HStack spacing={2}>
                  <Badge colorScheme={health.cuda_available ? 'green' : 'yellow'}>
                    {health.cuda_available ? `GPU: ${health.gpu_name}` : 'CPU Mode'}
                  </Badge>
                  <Badge colorScheme={health.model_loaded ? 'green' : 'red'}>
                    {health.model_loaded ? 'Model Ready' : 'Model Not Found'}
                  </Badge>
                </HStack>
              )}
            </HStack>
            <Text color="gray.400" fontSize="sm">
              Generate stunning images with Stable Diffusion XL
            </Text>
          </VStack>
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

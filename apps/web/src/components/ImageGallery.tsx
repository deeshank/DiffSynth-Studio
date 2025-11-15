import {
  Box,
  SimpleGrid,
  Image,
  Button,
  VStack,
  Text,
  HStack,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { FiDownload, FiMaximize2 } from 'react-icons/fi'
import { GeneratedImage } from './ImageGenerator'
import { useState } from 'react'

interface ImageGalleryProps {
  images: GeneratedImage[]
  generationTime: number
}

function ImageGallery({ images, generationTime }: ImageGalleryProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleDownload = (imageData: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = `sdxl-image-${Date.now()}-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZoom = (imageData: string) => {
    setSelectedImage(imageData)
    onOpen()
  }

  if (images.length === 0) {
    return (
      <Box
        bg="gray.800"
        borderRadius="xl"
        p={12}
        borderWidth="1px"
        borderColor="gray.700"
        textAlign="center"
        minH="400px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Text fontSize="6xl">🎨</Text>
          <Text fontSize="xl" color="gray.400">
            Your generated images will appear here
          </Text>
          <Text fontSize="sm" color="gray.500">
            Configure settings and click generate to start creating!
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <>
      <Box
        bg="gray.800"
        borderRadius="xl"
        p={6}
        borderWidth="1px"
        borderColor="gray.700"
        boxShadow="xl"
      >
        <VStack spacing={4} align="stretch">
          {/* Stats */}
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              Generated Images
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="green">{images.length} image(s)</Badge>
              <Badge colorScheme="blue">{generationTime.toFixed(1)}s</Badge>
            </HStack>
          </HStack>

          {/* Image Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {images.map((img, index) => (
              <Box
                key={img.timestamp}
                position="relative"
                borderRadius="lg"
                overflow="hidden"
                bg="gray.900"
                borderWidth="1px"
                borderColor="gray.700"
                transition="all 0.2s"
                _hover={{
                  transform: 'scale(1.02)',
                  borderColor: 'brand.500',
                  boxShadow: 'lg',
                }}
              >
                <Image
                  src={img.data}
                  alt={`Generated ${index + 1}`}
                  w="100%"
                  h="auto"
                />
                
                {/* Overlay Controls */}
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  bg="blackAlpha.700"
                  p={3}
                  opacity={0}
                  transition="opacity 0.2s"
                  _groupHover={{ opacity: 1 }}
                  sx={{
                    '.image-box:hover &': {
                      opacity: 1,
                    },
                  }}
                >
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.300">
                      Seed: {img.seed}
                    </Text>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Zoom"
                        icon={<FiMaximize2 />}
                        size="sm"
                        onClick={() => handleZoom(img.data)}
                      />
                      <IconButton
                        aria-label="Download"
                        icon={<FiDownload />}
                        size="sm"
                        colorScheme="brand"
                        onClick={() => handleDownload(img.data, index)}
                      />
                    </HStack>
                  </HStack>
                </Box>

                {/* Always visible controls on mobile */}
                <Box
                  display={{ base: 'block', md: 'none' }}
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  bg="blackAlpha.700"
                  p={3}
                >
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.300">
                      Seed: {img.seed}
                    </Text>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Zoom"
                        icon={<FiMaximize2 />}
                        size="sm"
                        onClick={() => handleZoom(img.data)}
                      />
                      <IconButton
                        aria-label="Download"
                        icon={<FiDownload />}
                        size="sm"
                        colorScheme="brand"
                        onClick={() => handleDownload(img.data, index)}
                      />
                    </HStack>
                  </HStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>

          {/* Download All Button */}
          {images.length > 1 && (
            <Button
              leftIcon={<FiDownload />}
              colorScheme="brand"
              variant="outline"
              onClick={() => {
                images.forEach((img, index) => {
                  setTimeout(() => handleDownload(img.data, index), index * 100)
                })
              }}
            >
              Download All ({images.length})
            </Button>
          )}
        </VStack>
      </Box>

      {/* Zoom Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" />
          <ModalBody p={0}>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Zoomed"
                maxH="90vh"
                mx="auto"
                borderRadius="lg"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ImageGallery

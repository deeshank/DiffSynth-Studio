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
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Divider,
} from '@chakra-ui/react'
import { FiDownload, FiMaximize2, FiShare2 } from 'react-icons/fi'
import { GeneratedImage } from './ImageGenerator'
import { useState } from 'react'

interface ImageGalleryProps {
  images: GeneratedImage[]
  generationTime: number
}

function ImageGallery({ images, generationTime }: ImageGalleryProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const toast = useToast()

  const handleDownload = (imageData: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = `dee-studio-${Date.now()}-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Downloaded!',
      description: `Image ${index + 1} saved to your downloads`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleShare = (img: GeneratedImage, index: number) => {
    // Create full shareable URL
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}${img.url}`
    
    // Copy shareable URL to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link Copied!',
        description: 'Shareable link copied to clipboard. Anyone can view this image!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        status: 'error',
        duration: 3000,
      })
    })
  }

  const handleZoom = (imageData: string) => {
    setSelectedImage(imageData)
    onOpen()
  }

  if (images.length === 0) {
    return (
      <Box
        bg="gray.800"
        borderRadius="lg"
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
        borderRadius="lg"
        p={5}
        borderWidth="1px"
        borderColor="gray.700"
        boxShadow="lg"
      >
        <VStack spacing={4} align="stretch">
          {/* Stats */}
          <HStack justify="space-between">
            <Text fontSize="md" fontWeight="bold">
              Generated Images
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="green" fontSize="xs">{images.length} image(s)</Badge>
              <Badge colorScheme="blue" fontSize="xs">{generationTime.toFixed(1)}s</Badge>
            </HStack>
          </HStack>

          <Divider borderColor="gray.700" />

          {/* Image Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {images.map((img, index) => (
              <Box
                key={img.timestamp}
                borderRadius="lg"
                overflow="hidden"
                bg="gray.900"
                borderWidth="1px"
                borderColor="gray.700"
              >
                {/* Image with zoom overlay */}
                <Box position="relative" cursor="pointer" onClick={() => handleZoom(img.data)}>
                  <Image
                    src={img.data}
                    alt={`Generated ${index + 1}`}
                    w="100%"
                    h="auto"
                  />
                  
                  {/* Zoom icon overlay */}
                  <Box
                    position="absolute"
                    top={2}
                    right={2}
                    opacity={0}
                    transition="opacity 0.2s"
                    _groupHover={{ opacity: 1 }}
                    sx={{
                      'div:hover &': {
                        opacity: 1,
                      },
                    }}
                  >
                    <IconButton
                      aria-label="Zoom"
                      icon={<FiMaximize2 />}
                      size="sm"
                      colorScheme="whiteAlpha"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleZoom(img.data)
                      }}
                    />
                  </Box>
                </Box>

                {/* Always visible controls */}
                <VStack spacing={2} p={3} align="stretch">
                  <Text fontSize="xs" color="gray.400">
                    Seed: {img.seed}
                  </Text>
                  
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<FiDownload />}
                      size="sm"
                      colorScheme="brand"
                      onClick={() => handleDownload(img.data, index)}
                      flex={1}
                    >
                      Download
                    </Button>
                    <Button
                      leftIcon={<FiShare2 />}
                      size="sm"
                      variant="outline"
                      colorScheme="brand"
                      onClick={() => handleShare(img, index)}
                      flex={1}
                    >
                      Share Link
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          {/* Download All Button */}
          {images.length > 1 && (
            <>
              <Divider borderColor="gray.700" />
              <Button
                leftIcon={<FiDownload />}
                colorScheme="brand"
                variant="outline"
                size="sm"
                onClick={() => {
                  images.forEach((img, index) => {
                    setTimeout(() => handleDownload(img.data, index), index * 100)
                  })
                  toast({
                    title: 'Downloading All',
                    description: `Downloading ${images.length} images...`,
                    status: 'info',
                    duration: 2000,
                  })
                }}
              >
                Download All ({images.length})
              </Button>
            </>
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

import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  FormControl,
  FormLabel,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { getModelsConfig, ModelConfig } from '../services/api'
import TextToImage from './TextToImage'
import ImageToImage from './ImageToImage'
import ImageGallery from './ImageGallery'

export interface GeneratedImage {
  data: string
  seed: number
  timestamp: number
}

function ImageGenerator() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generationTime, setGenerationTime] = useState<number>(0)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null)
  const toast = useToast()

  // Fetch model configurations
  const { data: modelsConfig, isLoading } = useQuery({
    queryKey: ['modelsConfig'],
    queryFn: getModelsConfig,
    onError: () => {
      toast({
        title: 'Failed to load models',
        description: 'Could not fetch model configurations',
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Set default model when config loads
  useEffect(() => {
    if (modelsConfig && !selectedModel) {
      setSelectedModel(modelsConfig.default_model)
    }
  }, [modelsConfig, selectedModel])

  // Update model config when selection changes
  useEffect(() => {
    if (modelsConfig && selectedModel) {
      const config = modelsConfig.models.find((m) => m.id === selectedModel)
      setModelConfig(config || null)
    }
  }, [modelsConfig, selectedModel])

  const handleImagesGenerated = (images: string[], seed: number, time: number) => {
    const newImages = images.map((img) => ({
      data: img,
      seed,
      timestamp: Date.now(),
    }))
    setGeneratedImages(newImages)
    setGenerationTime(time)
  }

  if (isLoading || !modelConfig) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading models...</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1.5fr' }} gap={6}>
        {/* Left Panel - Controls */}
        <GridItem>
          <Box
            bg="gray.800"
            borderRadius="lg"
            p={5}
            borderWidth="1px"
            borderColor="gray.700"
            boxShadow="lg"
          >
            {/* Model Selector - Compact */}
            <FormControl mb={4}>
              <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
                Model
              </FormLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                size="sm"
                bg="gray.900"
                borderColor="gray.600"
              >
                {modelsConfig?.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </Select>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {modelConfig.description}
              </Text>
            </FormControl>

            <Tabs colorScheme="brand" variant="soft-rounded" size="sm">
              <TabList mb={3}>
                <Tab fontSize="sm">📝 Text to Image</Tab>
                <Tab fontSize="sm">🖼️ Image to Image</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <TextToImage 
                    onGenerate={handleImagesGenerated}
                    modelId={selectedModel}
                    modelConfig={modelConfig}
                  />
                </TabPanel>
                <TabPanel p={0}>
                  <ImageToImage 
                    onGenerate={handleImagesGenerated}
                    modelId={selectedModel}
                    modelConfig={modelConfig}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </GridItem>

        {/* Right Panel - Gallery */}
        <GridItem>
          <ImageGallery
            images={generatedImages}
            generationTime={generationTime}
          />
        </GridItem>
      </Grid>
    </Box>
  )
}

export default ImageGenerator

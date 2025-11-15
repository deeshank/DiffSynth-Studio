import { useState } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
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

  const handleImagesGenerated = (images: string[], seed: number, time: number) => {
    const newImages = images.map((img) => ({
      data: img,
      seed,
      timestamp: Date.now(),
    }))
    setGeneratedImages(newImages)
    setGenerationTime(time)
  }

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1.5fr' }} gap={6}>
      {/* Left Panel - Controls */}
      <GridItem>
        <Box
          bg="gray.800"
          borderRadius="xl"
          p={6}
          borderWidth="1px"
          borderColor="gray.700"
          boxShadow="xl"
        >
          <Tabs colorScheme="brand" variant="soft-rounded">
            <TabList mb={4}>
              <Tab>📝 Text to Image</Tab>
              <Tab>🖼️ Image to Image</Tab>
            </TabList>

            <TabPanels>
              <TabPanel p={0}>
                <TextToImage onGenerate={handleImagesGenerated} />
              </TabPanel>
              <TabPanel p={0}>
                <ImageToImage onGenerate={handleImagesGenerated} />
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
  )
}

export default ImageGenerator

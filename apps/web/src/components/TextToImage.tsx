import { useState } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Text,
  Checkbox,
  useToast,
  Collapse,
} from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { generateImages, GenerateRequest } from '../services/api'

interface TextToImageProps {
  onGenerate: (images: string[], seed: number, time: number) => void
}

const DEFAULT_NEGATIVE_PROMPT = 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'

function TextToImage({ onGenerate }: TextToImageProps) {
  const toast = useToast()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT)
  const [showNegative, setShowNegative] = useState(false)
  const [size, setSize] = useState('1024x1024')
  const [numImages, setNumImages] = useState(1)
  const [steps, setSteps] = useState(20)
  const [cfgScale, setCfgScale] = useState(7.5)
  const [useFixedSeed, setUseFixedSeed] = useState(false)
  const [seed, setSeed] = useState(42)

  const mutation = useMutation({
    mutationFn: (data: GenerateRequest) => generateImages(data),
    onSuccess: (data) => {
      onGenerate(data.images, data.seed, data.generation_time)
      toast({
        title: 'Success!',
        description: `Generated ${data.images.length} image(s) in ${data.generation_time.toFixed(1)}s`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const [width, height] = size.split('x').map(Number)

    mutation.mutate({
      prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      num_images: numImages,
      steps,
      cfg_scale: cfgScale,
      seed: useFixedSeed ? seed : undefined,
    })
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Prompt */}
      <FormControl>
        <FormLabel>Prompt</FormLabel>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A beautiful landscape with mountains and a lake at sunset..."
          rows={4}
          resize="vertical"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {prompt.length} characters
        </Text>
      </FormControl>

      {/* Negative Prompt */}
      <FormControl>
        <Checkbox
          isChecked={showNegative}
          onChange={(e) => setShowNegative(e.target.checked)}
          mb={2}
        >
          <FormLabel mb={0}>Negative Prompt</FormLabel>
        </Checkbox>
        <Collapse in={showNegative}>
          <Textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid..."
            rows={3}
            resize="vertical"
          />
        </Collapse>
      </FormControl>

      {/* Size */}
      <FormControl>
        <FormLabel>Image Size</FormLabel>
        <Select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="512x512">512 × 512</option>
          <option value="768x768">768 × 768</option>
          <option value="1024x1024">1024 × 1024 (Recommended)</option>
          <option value="768x1024">768 × 1024 (Portrait)</option>
          <option value="1024x768">1024 × 768 (Landscape)</option>
        </Select>
      </FormControl>

      {/* Number of Images */}
      <FormControl>
        <FormLabel>Number of Images</FormLabel>
        <NumberInput
          value={numImages}
          onChange={(_, val) => setNumImages(val)}
          min={1}
          max={4}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      {/* Steps */}
      <FormControl>
        <FormLabel>
          Inference Steps: {steps}
        </FormLabel>
        <Slider
          value={steps}
          onChange={setSteps}
          min={10}
          max={50}
          step={1}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <Text fontSize="xs" color="gray.500">
          More steps = better quality but slower
        </Text>
      </FormControl>

      {/* CFG Scale */}
      <FormControl>
        <FormLabel>
          CFG Scale: {cfgScale.toFixed(1)}
        </FormLabel>
        <Slider
          value={cfgScale}
          onChange={setCfgScale}
          min={1}
          max={15}
          step={0.5}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <Text fontSize="xs" color="gray.500">
          How closely to follow the prompt (7-8 recommended)
        </Text>
      </FormControl>

      {/* Seed */}
      <FormControl>
        <Checkbox
          isChecked={useFixedSeed}
          onChange={(e) => setUseFixedSeed(e.target.checked)}
        >
          Use Fixed Seed
        </Checkbox>
        {useFixedSeed && (
          <NumberInput
            value={seed}
            onChange={(_, val) => setSeed(val)}
            min={0}
            max={999999999}
            mt={2}
          >
            <NumberInputField />
          </NumberInput>
        )}
      </FormControl>

      {/* Generate Button */}
      <Button
        colorScheme="brand"
        size="lg"
        onClick={handleGenerate}
        isLoading={mutation.isPending}
        loadingText="Generating..."
        isDisabled={!prompt.trim()}
      >
        🚀 Generate Images
      </Button>
    </VStack>
  )
}

export default TextToImage

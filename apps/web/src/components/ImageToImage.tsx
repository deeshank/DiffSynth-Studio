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
  Text,
  Checkbox,
  useToast,
  Collapse,
  Box,
  Image,
} from '@chakra-ui/react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { transformImage, TransformRequest } from '../services/api'

interface ImageToImageProps {
  onGenerate: (images: string[], seed: number, time: number) => void
}

const DEFAULT_NEGATIVE_PROMPT = 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'

function ImageToImage({ onGenerate }: ImageToImageProps) {
  const toast = useToast()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT)
  const [showNegative, setShowNegative] = useState(false)
  const [size, setSize] = useState('1024x1024')
  const [numImages, setNumImages] = useState(1)
  const [steps, setSteps] = useState(20)
  const [cfgScale, setCfgScale] = useState(7.5)
  const [denoisingStrength, setDenoisingStrength] = useState(0.75)
  const [useFixedSeed, setUseFixedSeed] = useState(false)
  const [seed, setSeed] = useState(42)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
  })

  const mutation = useMutation({
    mutationFn: ({ data, file }: { data: TransformRequest; file: File }) =>
      transformImage(data, file),
    onSuccess: (data) => {
      onGenerate(data.images, data.seed, data.generation_time)
      toast({
        title: 'Success!',
        description: `Transformed ${data.images.length} image(s) in ${data.generation_time.toFixed(1)}s`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Transformation Failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const handleTransform = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    if (!uploadedFile) {
      toast({
        title: 'Image Required',
        description: 'Please upload an image',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const [width, height] = size.split('x').map(Number)

    mutation.mutate({
      data: {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        num_images: numImages,
        steps,
        cfg_scale: cfgScale,
        denoising_strength: denoisingStrength,
        seed: useFixedSeed ? seed : undefined,
      },
      file: uploadedFile,
    })
  }

  const getStrengthLabel = () => {
    if (denoisingStrength < 0.4) return '✨ Light Touch'
    if (denoisingStrength > 0.7) return '🔥 Heavy Transform'
    return '⚖️ Balanced'
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Image Upload */}
      <FormControl>
        <FormLabel>Upload Image</FormLabel>
        <Box
          {...getRootProps()}
          p={6}
          border="2px dashed"
          borderColor={isDragActive ? 'brand.500' : 'gray.600'}
          borderRadius="md"
          cursor="pointer"
          bg={isDragActive ? 'gray.700' : 'gray.800'}
          transition="all 0.2s"
          _hover={{ borderColor: 'brand.400', bg: 'gray.700' }}
        >
          <input {...getInputProps()} />
          {previewUrl ? (
            <Image src={previewUrl} alt="Preview" maxH="200px" mx="auto" borderRadius="md" />
          ) : (
            <Text textAlign="center" color="gray.400">
              {isDragActive
                ? 'Drop the image here...'
                : 'Drag & drop an image, or click to select'}
            </Text>
          )}
        </Box>
      </FormControl>

      {/* Denoising Strength */}
      {uploadedFile && (
        <FormControl>
          <FormLabel>
            Transformation Strength: {denoisingStrength.toFixed(2)} {getStrengthLabel()}
          </FormLabel>
          <Slider
            value={denoisingStrength}
            onChange={setDenoisingStrength}
            min={0}
            max={1}
            step={0.05}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text fontSize="xs" color="gray.500">
            Higher = more changes, Lower = closer to original
          </Text>
        </FormControl>
      )}

      {/* Prompt */}
      <FormControl>
        <FormLabel>Prompt</FormLabel>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe how to transform the image..."
          rows={4}
          resize="vertical"
        />
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
            rows={3}
            resize="vertical"
          />
        </Collapse>
      </FormControl>

      {/* Size */}
      <FormControl>
        <FormLabel>Output Size</FormLabel>
        <Select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="512x512">512 × 512</option>
          <option value="768x768">768 × 768</option>
          <option value="1024x1024">1024 × 1024</option>
          <option value="768x1024">768 × 1024 (Portrait)</option>
          <option value="1024x768">1024 × 768 (Landscape)</option>
        </Select>
      </FormControl>

      {/* Number of Images */}
      <FormControl>
        <FormLabel>Number of Variations</FormLabel>
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
        <FormLabel>Inference Steps: {steps}</FormLabel>
        <Slider value={steps} onChange={setSteps} min={10} max={50} step={1}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </FormControl>

      {/* CFG Scale */}
      <FormControl>
        <FormLabel>CFG Scale: {cfgScale.toFixed(1)}</FormLabel>
        <Slider value={cfgScale} onChange={setCfgScale} min={1} max={15} step={0.5}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
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

      {/* Transform Button */}
      <Button
        colorScheme="brand"
        size="lg"
        onClick={handleTransform}
        isLoading={mutation.isPending}
        loadingText="Transforming..."
        isDisabled={!prompt.trim() || !uploadedFile}
      >
        🎨 Transform Image
      </Button>
    </VStack>
  )
}

export default ImageToImage

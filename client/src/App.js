import React, { useState } from 'react';
import { 
  ChakraProvider, 
  Container, 
  Heading, 
  VStack, 
  useToast, 
  Box, 
  Button, 
  Text, 
  Spinner,
  Input,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Progress
} from '@chakra-ui/react';
import PdfDropzone from './components/PdfDropzone';
import axios from 'axios';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [convertedData, setConvertedData] = useState(null);
  const [customFilename, setCustomFilename] = useState('converted-pdf');
  const toast = useToast();

  const handleFileAccepted = async (file) => {
    setIsLoading(true);
    setConvertedData(null);
    setCustomFilename(file.name.replace('.pdf', ''));
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post('http://localhost:5000/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setConvertedData(response.data);
      toast({
        title: 'Success',
        description: 'PDF converted successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to convert PDF',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!convertedData) return;

    const blob = new Blob([JSON.stringify(convertedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customFilename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return null;
    return Object.entries(metadata).map(([key, value]) => ({
      key: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      value: value
    }));
  };

  return (
    <ChakraProvider>
      <Container maxW="container.md" py={10}>
        <VStack spacing={8}>
          <Heading>PDF to JSON Converter</Heading>
          <PdfDropzone onFileAccepted={handleFileAccepted} />
          
          {isLoading && (
            <Box textAlign="center">
              <Spinner size="xl" />
              <Text mt={4}>Converting PDF...</Text>
            </Box>
          )}

          {convertedData && (
            <Box w="100%" p={4} borderWidth={1} borderRadius="lg">
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Text fontWeight="bold">Converted Data:</Text>
                  <Badge colorScheme="green" fontSize="sm">
                    {convertedData.numPages} {convertedData.numPages === 1 ? 'Page' : 'Pages'}
                  </Badge>
                </HStack>

                <Accordion allowMultiple>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">Document Analysis</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={4}>
                        <Box>
                          <Text fontWeight="medium">Document Type:</Text>
                          <Text textTransform="capitalize">{convertedData.analysis.documentType}</Text>
                          <Text fontSize="sm" color="gray.500">Confidence Score:</Text>
                          <Progress 
                            value={convertedData.analysis.confidence * 100} 
                            colorScheme="blue" 
                            size="sm"
                            mb={2}
                          />
                          <Text fontSize="sm" color="gray.500">
                            {(convertedData.analysis.confidence * 100).toFixed(1)}%
                          </Text>
                        </Box>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">SQL Table Structure</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={4}>
                        <Box>
                          <Text fontWeight="medium">Table Name:</Text>
                          <Code p={2} borderRadius="md" display="block">
                            {convertedData.analysis.sqlStructure.tableName}
                          </Code>
                        </Box>
                        
                        <Box>
                          <Text fontWeight="medium" mb={2}>Columns:</Text>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Name</Th>
                                <Th>Type</Th>
                                <Th>Constraints</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {convertedData.analysis.sqlStructure.columns.map((column, index) => (
                                <Tr key={index}>
                                  <Td>{column.name}</Td>
                                  <Td>{column.type}</Td>
                                  <Td>{column.constraints.join(', ')}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>

                        <Box>
                          <Text fontWeight="medium">Sample INSERT:</Text>
                          <Code p={2} borderRadius="md" display="block" whiteSpace="pre-wrap">
                            {convertedData.analysis.sqlStructure.sampleInsert}
                          </Code>
                        </Box>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">PDF Metadata</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        {formatMetadata(convertedData.metadata)?.map(({ key, value }) => (
                          <Box key={key} p={2} bg="gray.50" borderRadius="md">
                            <Text fontWeight="medium">{key}:</Text>
                            <Text>{value}</Text>
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">Extracted Text</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Box 
                        p={4} 
                        bg="gray.50" 
                        borderRadius="md" 
                        maxH="200px" 
                        overflowY="auto"
                        whiteSpace="pre-wrap"
                        fontFamily="monospace"
                      >
                        {convertedData.text}
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                <HStack spacing={4}>
                  <Input
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="Enter filename"
                    size="md"
                  />
                  <Button colorScheme="blue" onClick={handleDownload}>
                    Download JSON
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App; 
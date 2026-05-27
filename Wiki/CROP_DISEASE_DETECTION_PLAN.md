# Crop Disease Detection Integration Plan for Kisan_Sarthi

## Overview
Integrate AI-powered crop disease detection using image analysis into the Kisan_Sarthi agricultural assistant. Users can upload crop images via Telegram/WhatsApp to get instant disease diagnosis and treatment recommendations.

## Current Architecture
- Django REST API backend
- Telegram bot with media support
- Modular components: LLM, RAG, STT, TTS
- Bihar-focused agricultural knowledge base

## New Architecture
```
User uploads image
        ↓
Telegram/WhatsApp Bot
        ↓
Django REST API
        ↓
Disease Detection Service (New)
        ↓
ML Model Inference
        ↓
Disease Classification + Treatment
        ↓
LLM generates response in user's language
```

---

## Phase 1: Technology Stack & Model Selection

### 1.1 ML Framework Choices
**Recommended Stack:**
- **Framework**: TensorFlow/Keras or PyTorch
- **Model**: Convolutional Neural Network (CNN)
- **Architecture**: EfficientNet, ResNet, or MobileNetV3
- **Deployment**: TensorFlow Serving or ONNX Runtime

**Why this stack:**
- Mobile-friendly models for edge deployment
- Good accuracy for image classification
- Compatible with existing Python/Django setup

### 1.2 Target Diseases (Bihar Focus)
**Rice Diseases:**
- Bacterial Blight, Blast, Brown Spot, Sheath Blight
- Leaf Blight, False Smut, Bakanae

**Wheat Diseases:**
- Rust (Yellow, Brown, Black), Powdery Mildew
- Loose Smut, Karnal Bunt

**Maize Diseases:**
- Downy Mildew, Rust, Blight
- Maize Streak Virus, Ear Rot

**Pulse Diseases:**
- Wilt, Root Rot, Powdery Mildew
- Leaf Spot, Rust

### 1.3 Dataset Requirements
**Data Sources:**
- PlantVillage Dataset (public)
- Bihar Agricultural University datasets
- Kaggle agricultural datasets
- Custom data collection from Bihar farmers

**Minimum Dataset Size:**
- 5,000+ images per disease class
- 1,000+ healthy plant images
- Balanced classes for each crop type

---

## Phase 2: Model Development

### 2.1 Development Environment Setup
```bash
# Add to requirements.txt
tensorflow>=2.13.0
tensorflow-hub>=0.15.0
opencv-python>=4.8.0
Pillow>=10.0.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
seaborn>=0.12.0
```

### 2.2 Model Training Pipeline
Create `backend/disease_detection/` directory:
```
backend/disease_detection/
├── __init__.py
├── model.py              # ML model class
├── preprocessor.py       # Image preprocessing
├── trainer.py            # Training scripts
├── dataset.py            # Data loading utilities
├── config.py             # Model configuration
├── models/               # Saved model files
├── datasets/             # Training data
```

### 2.3 Model Architecture (`backend/disease_detection/model.py`)
```python
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model

class DiseaseDetectionModel:
    def __init__(self, num_classes=20):
        self.num_classes = num_classes
        self.model = self._build_model()

    def _build_model(self):
        """Build EfficientNet-based model for disease classification"""
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=(224, 224, 3)
        )

        # Freeze base model layers
        for layer in base_model.layers[:-20]:
            layer.trainable = False

        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(512, activation='relu')(x)
        x = Dropout(0.3)(x)
        predictions = Dense(self.num_classes, activation='softmax')(x)

        model = Model(inputs=base_model.input, outputs=predictions)
        return model

    def predict(self, image_path: str) -> dict:
        """Predict disease from image"""
        # Preprocess image
        processed_image = self._preprocess_image(image_path)

        # Make prediction
        predictions = self.model.predict(processed_image)
        predicted_class = np.argmax(predictions[0])
        confidence = predictions[0][predicted_class]

        return {
            'disease': self.class_names[predicted_class],
            'confidence': float(confidence),
            'all_predictions': predictions[0].tolist()
        }
```

### 2.4 Data Preprocessing (`backend/disease_detection/preprocessor.py`)
```python
import cv2
import numpy as np
from PIL import Image

class ImagePreprocessor:
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size

    def preprocess(self, image_path: str) -> np.ndarray:
        """Preprocess image for model input"""
        # Load image
        image = Image.open(image_path)
        
        # Resize
        image = image.resize(self.target_size)
        
        # Convert to array and normalize
        image_array = np.array(image) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array

    def enhance_image(self, image_path: str) -> str:
        """Enhance image quality for better detection"""
        image = cv2.imread(image_path)
        
        # Apply CLAHE for contrast enhancement
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        lab[:,:,0] = clahe.apply(lab[:,:,0])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        # Save enhanced image
        enhanced_path = image_path.replace('.jpg', '_enhanced.jpg')
        cv2.imwrite(enhanced_path, enhanced)
        
        return enhanced_path
```

---

## Phase 3: Backend Integration

### 3.1 Django Models Update
Update `backend/api/models.py`:
```python
class DiseaseDetection(models.Model):
    user = models.ForeignKey(UserSettings, on_delete=models.CASCADE)
    image_path = models.CharField(max_length=500)
    predicted_disease = models.CharField(max_length=100)
    confidence = models.FloatField()
    crop_type = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class TreatmentRecommendation(models.Model):
    disease = models.CharField(max_length=100, unique=True)
    crop_type = models.CharField(max_length=50)
    symptoms = models.TextField()
    treatment = models.TextField()
    prevention = models.TextField()
    language = models.CharField(max_length=10, default='en')
```

### 3.2 API Endpoints
Update `backend/api/views.py`:
```python
@api_view(['POST'])
def detect_disease(request):
    """Detect crop disease from uploaded image"""
    user_id = request.data.get('user_id')
    image_file = request.FILES.get('image')
    crop_type = request.data.get('crop_type', '')

    if not user_id or not image_file:
        return Response({"error": "user_id and image are required"}, status=400)

    try:
        # Save image temporarily
        temp_path = save_uploaded_image(image_file)

        # Detect disease
        detector = DiseaseDetectionService()
        result = detector.detect(temp_path, crop_type)

        # Get treatment recommendations
        treatment = get_treatment_recommendations(
            result['disease'],
            request.user_settings.language
        )

        # Save to database
        DiseaseDetection.objects.create(
            user_id=user_id,
            image_path=temp_path,
            predicted_disease=result['disease'],
            confidence=result['confidence'],
            crop_type=crop_type
        )

        return Response({
            "disease": result['disease'],
            "confidence": result['confidence'],
            "treatment": treatment,
            "prevention_tips": treatment.get('prevention', '')
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)
```

### 3.3 Disease Detection Service
Create `backend/disease_detection/service.py`:
```python
from .model import DiseaseDetectionModel
from .preprocessor import ImagePreprocessor

class DiseaseDetectionService:
    def __init__(self):
        self.model = DiseaseDetectionModel()
        self.preprocessor = ImagePreprocessor()
        self.model.load_weights('path/to/trained/model.h5')

    def detect(self, image_path: str, crop_type: str = '') -> dict:
        """Main disease detection method"""
        try:
            # Enhance image quality
            enhanced_path = self.preprocessor.enhance_image(image_path)
            
            # Preprocess for model
            processed_image = self.preprocessor.preprocess(enhanced_path)
            
            # Get prediction
            result = self.model.predict(enhanced_path)
            
            # Filter by crop type if specified
            if crop_type:
                result = self._filter_by_crop(result, crop_type)
            
            return result
            
        except Exception as e:
            return {"error": str(e)}
```

---

## Phase 4: Bot Integration

### 4.1 Telegram Bot Updates
Update `telegram_bot/bot.py`:
```python
async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle photo uploads for disease detection"""
    user_id = str(update.message.chat_id)
    
    # Get photo file
    photo = update.message.photo[-1]  # Get highest resolution
    file = await context.bot.get_file(photo.file_id)
    
    # Download image
    image_path = f"temp_{user_id}_{photo.file_id}.jpg"
    await file.download_to_drive(image_path)
    
    # Ask for crop type if not specified
    if not context.user_data.get('crop_type'):
        keyboard = [
            [InlineKeyboardButton("Rice 🌾", callback_data='crop_rice')],
            [InlineKeyboardButton("Wheat 🌾", callback_data='crop_wheat')],
            [InlineKeyboardButton("Maize 🌽", callback_data='crop_maize')],
            [InlineKeyboardButton("Pulses 🫘", callback_data='crop_pulses')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(
            "Please select the crop type for disease detection:",
            reply_markup=reply_markup
        )
        context.user_data['pending_image'] = image_path
        return
    
    # Process disease detection
    await process_disease_detection(update, user_id, image_path, context.user_data['crop_type'])

async def process_disease_detection(update, user_id, image_path, crop_type):
    """Process disease detection and send response"""
    processing_msg = await update.message.reply_text("🔍 Analyzing crop image...")
    
    try:
        # Call disease detection API
        payload = {
            'user_id': user_id,
            'crop_type': crop_type
        }
        files = {'image': open(image_path, 'rb')}
        
        response = requests.post(
            f"{BACKEND_URL}/detect-disease/",
            data=payload,
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            disease = data.get('disease', 'Unknown')
            confidence = data.get('confidence', 0) * 100
            treatment = data.get('treatment', {})
            
            response_text = f"""
🌱 **Disease Detected:** {disease}
📊 **Confidence:** {confidence:.1f}%

💊 **Treatment:**
{treatment.get('treatment', 'Consult local agricultural expert')}

🛡️ **Prevention:**
{treatment.get('prevention', 'Follow good agricultural practices')}
            """
            
            await processing_msg.edit_text(response_text, parse_mode='MarkdownV2')
        else:
            await processing_msg.edit_text("❌ Failed to analyze image. Please try again.")
            
    except Exception as e:
        await processing_msg.edit_text(f"⚠️ Error: {str(e)}")
    
    finally:
        # Clean up temp file
        if os.path.exists(image_path):
            os.remove(image_path)
```

### 4.2 URL Configuration
Update `backend/django_project/urls.py`:
```python
from api.views import detect_disease

urlpatterns = [
    # Existing URLs...
    path('detect-disease/', detect_disease, name='detect_disease'),
]
```

---

## Phase 5: Treatment Database

### 5.1 Populate Treatment Data
Create management command to populate treatment recommendations:
```python
# backend/api/management/commands/populate_treatments.py
from django.core.management.base import BaseCommand
from api.models import TreatmentRecommendation

class Command(BaseCommand):
    def handle(self, *args, **options):
        treatments = [
            {
                'disease': 'Rice Blast',
                'crop_type': 'rice',
                'symptoms': 'Diamond-shaped lesions with gray centers and brown borders',
                'treatment': 'Apply fungicides like Tricyclazole or Carbendazim. Remove infected plant debris.',
                'prevention': 'Use resistant varieties, avoid excessive nitrogen, ensure proper field drainage.'
            },
            # Add more treatments...
        ]
        
        for treatment in treatments:
            TreatmentRecommendation.objects.get_or_create(**treatment)
        
        self.stdout.write("Treatment database populated successfully!")
```

### 5.2 Multilingual Support
Store treatment recommendations in multiple languages:
- English (base)
- Hindi
- Bhojpuri

---

## Phase 6: Training & Model Deployment

### 6.1 Data Collection
1. **Public Datasets:**
   - PlantVillage Dataset
   - AI4Agriculture datasets
   - Kaggle crop disease datasets

2. **Local Data Collection:**
   - Partner with Bihar Agricultural University
   - Collect from local farmers
   - Use existing project data

### 6.2 Model Training
```bash
# Training script
python backend/disease_detection/trainer.py \
    --dataset_path datasets/ \
    --model_output models/disease_model.h5 \
    --epochs 50 \
    --batch_size 32
```

### 6.3 Model Evaluation
- Accuracy: Target >85%
- Precision/Recall per disease class
- Confusion matrix analysis
- Cross-validation

### 6.4 Model Deployment
- Save model in TensorFlow SavedModel format
- Implement model versioning
- Add model monitoring and retraining pipeline

---

## Phase 7: User Experience Features

### 7.1 Interactive Crop Selection
- Buttons for crop type selection
- Auto-detection based on image features (future enhancement)

### 7.2 Result Presentation
- Disease name and confidence score
- Visual symptoms description
- Step-by-step treatment instructions
- Prevention tips
- Contact information for local experts

### 7.3 Follow-up Recommendations
- Suggest when to re-check crops
- Recommend preventive measures
- Link to government schemes

### 7.4 Offline Capability
- Cache common disease information
- Store treatment guides locally

---

## Phase 8: Testing & Validation

### 8.1 Unit Tests
```python
# backend/disease_detection/tests.py
class DiseaseDetectionTests(TestCase):
    def test_image_preprocessing(self):
        # Test image preprocessing pipeline
        pass
    
    def test_model_prediction(self):
        # Test model inference
        pass
    
    def test_api_endpoint(self):
        # Test Django API endpoint
        pass
```

### 8.2 Integration Tests
- End-to-end testing with Telegram bot
- Image upload and processing flow
- Database storage and retrieval

### 8.3 Performance Testing
- Response time < 10 seconds
- Memory usage monitoring
- Concurrent user handling

---

## Phase 9: Implementation Timeline

### Week 1-2: Research & Setup
- [ ] Research ML models and datasets
- [ ] Set up development environment
- [ ] Collect initial dataset
- [ ] Create project structure

### Week 3-4: Model Development
- [ ] Implement data preprocessing
- [ ] Build CNN model architecture
- [ ] Train initial model
- [ ] Evaluate and iterate

### Week 5-6: Backend Integration
- [ ] Create Django models and APIs
- [ ] Implement disease detection service
- [ ] Add treatment recommendation system
- [ ] Integrate with existing user management

### Week 7-8: Bot Integration
- [ ] Update Telegram bot for image handling
- [ ] Add crop selection interface
- [ ] Implement result formatting
- [ ] Test end-to-end flow

### Week 9-10: Testing & Deployment
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Production deployment
- [ ] User acceptance testing

---

## Cost Considerations

### Development Costs
- **Dataset Collection**: $500-2000 (if purchasing datasets)
- **Compute Resources**: $100-500 (Google Colab/AWS)
- **Expert Consultation**: $200-1000 (agricultural experts)

### Infrastructure Costs
- **Model Storage**: $5-20/month
- **API Calls**: Minimal additional cost
- **Image Storage**: $1-5/month

### Maintenance Costs
- **Model Retraining**: Quarterly updates
- **Dataset Expansion**: Annual data collection
- **Performance Monitoring**: Ongoing

---

## Success Metrics

- [ ] Model accuracy >85% on test set
- [ ] Response time <10 seconds
- [ ] User satisfaction >80%
- [ ] Daily active users with image uploads
- [ ] Reduction in farmer queries to human experts

---

## Challenges & Solutions

### Challenge 1: Limited Training Data
**Solution**: Use data augmentation, transfer learning, synthetic data generation

### Challenge 2: Model Accuracy in Field Conditions
**Solution**: Collect real-world images, domain adaptation techniques

### Challenge 3: Multilingual Treatment Information
**Solution**: Collaborate with agricultural universities for localized content

### Challenge 4: Mobile Network Constraints
**Solution**: Optimize model size, implement progressive loading

---

## Future Enhancements

1. **Advanced Features:**
   - Severity assessment (mild/moderate/severe)
   - Multiple disease detection in single image
   - Time-series analysis for disease progression

2. **Integration Features:**
   - Weather data integration for prediction
   - Soil health correlation
   - Pest detection alongside diseases

3. **Scalability:**
   - Model compression for mobile deployment
   - Federated learning for privacy-preserving updates
   - Multi-crop support expansion

---

## Getting Started

1. **Immediate Actions:**
   - Start dataset collection
   - Set up ML development environment
   - Review existing agricultural data

2. **First Milestone:**
   - Working prototype with basic disease detection
   - Integration with Telegram bot

3. **Launch Criteria:**
   - Model accuracy >80%
   - Complete treatment database
   - Tested with real users

This comprehensive plan provides a roadmap for implementing AI-powered crop disease detection in your Kisan_Sarthi project, specifically tailored for Bihar farmers.</content>
<parameter name="filePath">/Users/priyanshukumar/Desktop/git project/Kisan_Sarthi/Kisan_Sarthi/CROP_DISEASE_DETECTION_PLAN.md
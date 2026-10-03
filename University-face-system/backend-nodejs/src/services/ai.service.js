const axios = require('axios');

const axiosInstance = axios.create({
    headers: {
        'bypass-tunnel-reminder': 'true',
        'Bypass-Tunnel-Reminder': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    timeout: 12000
});

const getAiUrl = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AiService {
    /**
     * Send base64 image to AI service to verify against a specific student's embedding
     */
    static async verifyFace(studentId, base64Image) {
        try {
            const response = await axiosInstance.post(`${getAiUrl()}/api/v1/verify`, {
                student_id: studentId,
                image_base64: base64Image
            });
            return response.data; // Expected { match: true/false, confidence: 0.95 }
        } catch (error) {
            console.error('AI Service Error (verifyFace):', error.message);
            return { match: false, confidence: 0, message: 'Could not verify face with AI service' };
        }
    }

    /**
     * Send base64 image to AI service to register face embedding for a student
     */
    static async registerFace(studentId, base64Image) {
        try {
            const response = await axiosInstance.post(`${getAiUrl()}/api/v1/register`, {
                student_id: studentId,
                image_base64: base64Image
            });
            return response.data; // Expected { success: true }
        } catch (error) {
            const detail = error.response?.data?.detail || error.message;
            console.error('AI Service Error (registerFace):', detail);
            throw new Error(detail || 'Không thể đăng ký vector khuôn mặt với AI service');
        }
    }

    /**
     * Send base64 image to AI service to detect face and head pose
     */
    static async detectPose(base64Image) {
        try {
            const response = await axiosInstance.post(`${getAiUrl()}/api/v1/detect_pose`, {
                image_base64: base64Image
            });
            return response.data; // Expected { success, box, pose }
        } catch (error) {
            console.error('AI Service Error (detectPose):', error.message);
            return { success: false, pose: null, box: null };
        }
    }

    /**
     * Send 3 base64 images to AI service to register 3-step face embedding
     */
    static async registerFace3Step(studentId, imgStraight, imgLeft, imgRight) {
        try {
            const response = await axiosInstance.post(`${getAiUrl()}/api/v1/register_3step`, {
                student_id: studentId,
                image_straight: imgStraight,
                image_left: imgLeft,
                image_right: imgRight
            });
            return response.data; // Expected { success: true }
        } catch (error) {
            const detail = error.response?.data?.detail || error.message;
            console.error('AI Service Error (registerFace3Step):', detail);
            throw new Error(detail || 'Không thể đăng ký 3 bước vector khuôn mặt với AI service');
        }
    }

    /**
     * Send base64 image to AI service to identify matching student from database (1:N)
     */
    static async identifyFace(base64Image) {
        try {
            const response = await axiosInstance.post(`${getAiUrl()}/api/v1/identify`, {
                image_base64: base64Image
            });
            
            if (typeof response.data === 'string' && response.data.includes('html')) {
                console.error('AI Service Error (identifyFace): Received HTML landing page from tunnel');
                return { match: false, message: 'Tunnel IP verification required' };
            }
            
            return response.data; // Expected { match: true/false, student_id: 12, confidence: 0.92 }
        } catch (error) {
            console.error('AI Service Error (identifyFace):', error.message);
            return { match: false, confidence: 0, message: 'Could not identify face with AI service' };
        }
    }
}

module.exports = AiService;


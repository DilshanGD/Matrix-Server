// Backend/src/routes/student.mjs

import { Router } from 'express';
import { validationResult, matchedData, checkSchema } from 'express-validator';
import { studentRegistrationValidation, studentLoginValidation, studentUpdateValidation } from '../utils/studentDetailsValidation.mjs';
import { isStudentAuth, verifyToken } from '../utils/studentMiddleware.mjs';    // Authentication middleware
import { registrationNo, extractRegNo } from '../utils/utils.mjs';    
import { Op } from 'sequelize';
import Models from "../db/models.mjs";
import jwt from 'jsonwebtoken';


const router = Router();

// Student registration api
/*router.post("/student/student-registration", checkSchema(studentRegistrationValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        const emailExist = await Models.Student.count({where: { email: data.email }});
        if(emailExist){
            return res.status(409).json({error: "Already-Registered-email"});
            // redirect to student registration page
        }

        const batchExist = await Models.Batch.count({   // Find given batch is exists in Batches table
            where: {
              batch_id: data.batch_id
            }
        });
        if(!batchExist){                                                   // checks the batch is exists
            return res.status(403).json({error: "Invalid Batch"});               // if not exists 
            // redirect to student registration page
        }

        const streamExist = await Models.Stream.count({  // Find given stream is exists in Streams table
            where: { 
                stream_id: data.stream_id 
            }
        });
        if(!streamExist){                                                // checks the stream is exists
            return res.status(403).send({error: "Invalid Stream"});               // if not exists 
            // redirect to student registration page
        }

        // const modelCount = await Models.Student.count({
        //     where: {
        //         batch_id: data.batch_id,
        //         stream_id: data.stream_id
        //     }
        // });

        const lastStudent = await Models.Student.findOne({  // Fetch the highest registration number in the given batch and stream
            where: {
                batch_id: data.batch_id,
                stream_id: data.stream_id
            },
            order: [['reg_no', 'DESC']]  // Sort by registration number in descending order
        });
        console.log(`Last number: ${lastStudent.reg_no}`);
        // Extract the last number and increment it
        let newRegNo;
        if (lastStudent.reg_no) {
            const lastRegNo = extractRegNo(lastStudent.reg_no, data.batch_id, data.stream_id);
            console.log(`Last number: ${lastRegNo}`);
            newRegNo = registrationNo(data.stream_id, data.batch_id, lastRegNo);  // Increment the last number
        } else {
            newRegNo = registrationNo(data.stream_id, data.batch_id, 0);  // If no students exist, start from 0001
        }
        console.log(`Registration number: ${newRegNo}`);
        // data.reg_no = registrationNo(data.stream_id, data.batch_id, modelCount);  // Assigning registration number 
          
        const savedStudent = await Models.Student.create({       // Insert into Students table
            reg_no: newRegNo,
            full_name: data.full_name,
            email: data.email,
            batch_id: data.batch_id,
            stream_id: data.stream_id,
            district: data.district,
            school: data.school,
            gender: data.gender,
            phone: data.phone,
            pwd: data.pwd,
            profile_pic: data.profile_pic
        });
        
        const savedParent = await Models.Parent.create({
            reg_no: newRegNo,
            email: data.emailParent,
            phone: data.phoneParent,
            parent_name: data.parentName
        });

        // Use email function to send email with reg_no 

        return res.status(201).json(savedStudent);
        // res.redirect("/student/student-login");  // Forward to login page
    } catch(err) {
        console.error("Error is:", err.errors);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).json({ error: "Error registering student" });    
        //return res.redirect("/student/student_registration");   // Forward to registration page again with relevent error message
    }
})*/
router.post("/student/student-registration", checkSchema(studentRegistrationValidation), async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty())
        return res.status(400).send({ errors: result.array() });  // Validation errors
    
    const data = matchedData(req);  // Grab data from request

    try {
        const emailExist = await Models.Student.count({ where: { email: data.email } });
        if (emailExist) {
            return res.status(409).json({ error: "Already-Registered-email" });
        }

        const batchExist = await Models.Batch.count({ where: { batch_id: data.batch_id } });
        if (!batchExist) {
            return res.status(403).json({ error: "Invalid Batch" });
        }

        const streamExist = await Models.Stream.count({ where: { stream_id: data.stream_id } });
        if (!streamExist) {
            return res.status(403).json({ error: "Invalid Stream" });
        }

        const lastStudent = await Models.Student.findOne({
            where: { batch_id: data.batch_id, stream_id: data.stream_id },
            order: [['reg_no', 'DESC']]
        });

        let newRegNo;
        if (lastStudent && lastStudent.reg_no) {
            const lastRegNo = extractRegNo(lastStudent.reg_no, data.batch_id, data.stream_id);
            newRegNo = registrationNo(data.stream_id, data.batch_id, lastRegNo);
        } else {
            newRegNo = registrationNo(data.stream_id, data.batch_id, 0);
        }

        const savedStudent = await Models.Student.create({
            reg_no: newRegNo,
            full_name: data.full_name,
            email: data.email,
            batch_id: data.batch_id,
            stream_id: data.stream_id,
            district: data.district,
            school: data.school,
            gender: data.gender,
            phone: data.phone,
            pwd: data.pwd,
            profile_pic: data.profile_pic
        });

        const savedParent = await Models.Parent.create({
            reg_no: newRegNo,
            email: data.emailParent,
            phone: data.phoneParent,
            parent_name: data.parentName
        });

        // Send email to the student (use Nodemailer or any email service)
        // sendEmail(savedStudent.email, newRegNo); 

        return res.status(201).json(savedStudent);
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).json({ error: err });
    }
});

// Student login api
router.post("/student/student-login",checkSchema(studentLoginValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});

    const data = matchedData(req);

    try {
        const findStudent = await Models.Student.findOne({ where: { email: data.email }});   // Search student with the requested api
        
        if(!findStudent)                             // Checks requested is found or not
            return res.status(404).send("Unregistered Student");
            
        if(findStudent.pwd !== data.pwd)             // Checks password for the login request
            return res.status(404).send("Invalid Password");

        const token = jwt.sign(
            {reg_no: findStudent.reg_no, full_name: findStudent.full_name, profile_pic: findStudent.profile_pic },
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );
        

        return res.cookie("accessToken", token).status(200).json({ token });
        //return res.redirect("/student/student_dashboard");                     // Forward to student dashboard
    } catch(err) {
        return res.status(400).json({ message: err.message });
        //return res.redirect("/student/student_login");                     // Forward to same student login page with msg of error
    }
})

// Student logout api
router.post("/student/logout", async(req, res) => {
    res.clearCookie("accessToken",{
        secure: true,
        sameSite: "none"
    }).status(200).json({message: "Logged out Successfully."});
})

// Student profile view api
router.post("/student/student-profile", isStudentAuth, async (req, res) => {    // Student profile request
    try {
        const findStudent = await Models.Student.findOne({ where: { reg_no: req.session.reg_no }});  // Load relevent table
        return res.status(200).send(findStudent);
    } catch (err) {
        //console.log(err.message);
        return res.status(400).send(err.message);
    }
})

// Update student details api
router.patch("/student/student-profile-update", isStudentAuth, checkSchema(studentUpdateValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        if(data.email){
            // const emailExist = await Models.Student.count({ where: { email: data.email }});
            // if(emailExist > 1){
            //     return res.status(409).send("Already-Registered-email");
            //     // redirect to student profile update page
            // }
            const emailExist = await Models.Student.count({ 
                where: { 
                    email: data.email, 
                    reg_no: { [Op.ne]: req.session.reg_no }  // Exclude current student's reg_no
                } 
            });
            if (emailExist > 0) {
                return res.status(409).send("Already-Registered-email");
            }
        }

        if(data.batch_id){
            const batchExist = await Models.Batch.count({ where: { batch_id: data.batch_id }});
            if(!batchExist){                                                   // checks the batch is exists
                return res.status(404).send("Invalid-Batch");                  // if not exists 
                // redirect to student profile update page
            }
        }
        
        if(data.stream_id){
            const streamExist = await Models.Stream.count({ where: { stream_id: data.stream_id }});
            if(!streamExist){                                                // checks the stream is exists
                return res.status(404).send("Invalid-Stream");               // if not exists 
                // redirect to student profile update page
            }
        }
         
        // Update student details
        const [affectedRows, savedStudent] = await Models.Student.update({
            full_name: data.full_name,
            email: data.email,
            district: data.district,
            school: data.school,
            gender: data.gender,
            phone: data.phone,
            pwd: data.pwd,
            profile_pic: data.profile_pic
        },{
            where: {
                reg_no: req.session.reg_no
            },
            returning: true  // This will returned the updated record
        });
        
        // Update parents details
        await Models.Parent.update({
            email: data.emailParent,
            phone: data.phoneParent,
            parent_name: data.parentName
        },{
            where: {
                reg_no: req.session.reg_no
            }
        });

        return res.status(201).send(savedStudent);
        // redirect student profile page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).send({error: err.message});      
        //return res.redirect("/student/student_profile_update");   // Forward to student profile update again with the msg of already registered email
    }
})

// New student registration page 
router.get("/student/new-student-registration", async (req, res) => {    // Load Streams and Batches
    try {
        const findStream = await Models.Stream.findAll({   // Load streams
            attributes: ['stream_id', 'title']
        });  
        const findBatch = await Models.Batch.findAll({attributes: ['batch_id']});    // Load batches
        return res.status(200).send({
            streams: findStream,
            batches: findBatch
        });
    } catch (err) {
        //console.log(err.message);
        return res.status(400).send(err.message);
    }
})

// Student top bar component api
router.post("/student/student-topbar", verifyToken, async (req, res) => {
    try {
        const findStudent = await Models.Student.findOne({
            where: { reg_no: req.user.reg_no },
            attributes: ['full_name', 'reg_no', 'profile_pic']
        });

        if (!findStudent) {
            return res.status(404).json({ message: "Student not found" });
        }

        const navLogo = await Models.Front_Detail.findOne({
            where: { type: 'nav' },
            attributes: ['file_path']
        });

        return res.status(200).json({
            full_name: findStudent.full_name,
            reg_no: findStudent.reg_no,
            profile_pic: findStudent.profile_pic,
            nav_logo: navLogo ? navLogo.file_path : 'default-logo.png'
        });
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});





export default router;
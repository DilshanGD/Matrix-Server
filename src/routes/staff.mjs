// Backend/src/routes/staff.mjs

import { Router } from "express";
import { validationResult, matchedData, checkSchema } from "express-validator";
import { staffUpdateValidation, staffLoginValidation, staffBiographyValidation, staffQualificationValidation, 
    staffQualificationUpdateValidation, tipsValidation, booksValidation, blogValidation } from "../utils/staffDetailsValidation.mjs";
import Models from "../db/models.mjs";
import { bookId, extractBookId } from "../utils/utils.mjs";
//import { tipsValidation } from "../utils/adminDetailsValidation.mjs";
//import { isAuth } from "../utils/middleware.mjs";    // Authentication middleware

const router = Router();

// Staff login API
router.post("/staff/staff-login",checkSchema(staffLoginValidation), async (req, res) => {  // Staff login api
    const result = validationResult(req);

    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});

    const data = matchedData(req);

    try {
        const findStaff = await Models.Staff.findOne({ where: { email: data.email }});   // Search staff with the requested api
        
        if(!findStaff)                             // Checks requested is found or not
            throw new Error("Unregistered Staff");
            
        if(findStaff.pwd !== data.pwd)             // Checks password for the login request
            throw new Error("Invalid pwd");

        req.session.isAuth = true;                   // Session variable for authorization check
        req.session.username = findStaff.username;   // Store username in session

        return res.status(200).send([findStaff, "Login Successfully"]);
        //return res.redirect("/staff/staff-dashboard");                     // Forward to staff dashboard
    } catch(err) {
        //console.log(err.message);
        return res.status(400).send(err.message);
        //return res.redirect("/staff/staff-login");    // Forward to staff login page with msg of error
    }
});

// Staff update API
router.patch("/staff/staff-profile-update", checkSchema(staffUpdateValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        const currentStaff = await Models.Staff.findOne({ where: { username: req.session.username } });

        // Checks email is already used one or not
        if(data.email && data.email !== currentStaff.email){
            const emailExist = await Models.Staff.count({ where: { email: data.email }});
            if(emailExist > 0){                                              // checks email exists more than once
                return res.status(409).send("Already-Registered-email");
                // redirect to staff update page
            }
        }
        
        // Checks username is already used one or not
        let usernameChanged = false;
        if(data.username && data.username !== currentStaff.username){
            const usernameExist = await Models.Staff.count({ where: { username: data.username }});
            if(usernameExist > 0){                                                   
                return res.status(409).send("Already-Registered-username");
                // redirect to staff update page
            }
            usernameChanged = true; // Mark that the username has changed
        }
        
        // Checks the subject is valid or not
        if(data.sub_id){
            const subExist = await Models.Subject.count({ where: { sub_id: data.sub_id }});
            if(!subExist){                          
                return res.status(404).send("Invalid-Subject");
                // res.redirect("/staff/staff-update");  // Forward to staff-update page
            }
        }

        // Updates staff profile
        const [affectedRows, [savedStaff]] = await Models.Staff.update({
            username: data.username,
            full_name: data.full_name,
            email: data.email,
            sub_id: data.sub_id,
            gender: data.gender,
            pwd: data.pwd,
            profile_pic: data.profile_pic
        },{
            where: {
                username: req.session.username
            },
            returning: true  // This will returned the updated record
        });

        // Update session username and username in the Staff_Phone table if it has changed
        if (usernameChanged) {
            req.session.username = data.username  // Update sessions username variable with new username
            await Models.Staff_Phone.update(
                { username: data.username }, // Set new username
                { where: { username: currentStaff.username } 
            });
        }
        
        // Update or Create home phone number
        if(data.phoneHome){
            const [staffHome, [createdHome]] = await Models.Staff_Phone.findOrCreate({
                where: {
                    username: data.username,
                    phoneType: "H"
                },
                defaults: { 
                    username: data.username, 
                    phone: data.phoneHome,
                    phoneType: "H" 
                }
            });
            if (!createdHome) {
                await Models.Staff_Phone.update({
                    phone: data.phoneHome
                },{
                    where: {
                        username: data.username,
                        phoneType: "H"
                    }
                });
            }
        }

        // Update or Create mobile phone number
        if(data.phoneMobile){
            const [staffMobile, [createdMobile]] = await Models.Staff_Phone.findOrCreate({
                where: {
                    username: data.username,
                    phoneType: "M"
                },
                defaults: { 
                    username: data.username, 
                    phone: data.phoneMobile,
                    phoneType: "M" 
                }
            });
            if (!createdMobile) {
                await Models.Staff_Phone.update({
                    phone: data.phoneMobile
                },{
                    where: {
                        username: data.username,
                        phoneType: "M"
                    }
                });
            }
        }

        return res.status(200).send(savedStaff);
        // res.redirect("/staff/staff-dashboard");  // Forward to staff home dashboard
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(400).send("Error updating profile");      
        //return res.redirect("/staff/staff-update");   // Forward to staff update page again with relevent error msg
    }
});

// Staff profile view API
router.get("/staff/staff-profile", async (req, res) => { 
    try {
        const findStaff = await Models.Staff.findOne({ where: { username: req.session.username }});  // Load relevent table
        return res.status(200).send(findStaff);
    } catch (err) {
        //console.log(err.message);
        return res.status(400).send(err.message);
    }
});

// Staff biography view API
router.get("/staff/biography-view", async (req, res) => {
    const username = req.session.username;

    try {
        const staff = await Models.Staff.findOne({
            where: { username },
            attributes: [ 'biography' ]
        });

        if (!staff) {
            return res.status(404).send("Staff member not found");
            // Redirect to staff biography edit page
        }

        return res.status(200).json(staff);
        // Redirect to staff biograpy edit page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching biography");
        // Redirect to staff profile view page
    }
});

// Staff update biography API
router.patch("/staff/biography-update", checkSchema(staffBiographyValidation), async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    const { biography } = matchedData(req);
    const username = req.session.username; 

    try {
        const [updatedRows, [updatedStaff]] = await Models.Staff.update(
            { biography },
            {
                where: { username },
                returning: true
            }
        );

        if (updatedRows === 0) {
            return res.status(404).send("Staff member not found"); // If staff member does not exist
        }

        return res.status(200).json(updatedStaff);
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error updating biography"); // Handle unexpected errors
    }
});

// Staff qualification add API
router.post('/staff/qualification-add', checkSchema(staffQualificationValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const data = matchedData(req);          // grabing data posted from client side.
    const username = req.session.username;

    try {
        // Check if the qualification already exists for this staff member
        const existingQualification = await Models.Staff_Qualification.findOne({  
            where: { username, title: data.title }
        });
        if (existingQualification) {
            return res.status(409).json({ error: "Qualification already exists" });
            // Redirect to staff update page
        }

        const savedQualification = await Models.Staff_Qualification.create({  // Add new data to Staff_Qualification table
            username,
            title: data.title,
            type: data.type,
            ...(data.institute && { institute: data.institute })  // Conditionally include institute if provided
        });

        return res.status(201).json(savedQualification);
        // Redirect to staff update page
    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).send("Error adding qualification");
        // Redirect to staff update page
    }
});

// Staff qualification update API
router.patch('/staff/qualification-update', checkSchema(staffQualificationUpdateValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const data = matchedData(req); 
    const username = req.session.username;

    try {
        const qualification = await Models.Staff_Qualification.findOne({  // Check if the qualification exists with the current title
            where: { username, title: data.title } 
        });

        if (!qualification) {
            return res.status(404).json({ error: "Qualification not found" });
        }

        const updatedQualification = await qualification.update({
            type: data.type,  
            ...(data.institute && { institute: data.institute })  // Conditionally update institute if provided
        });

        return res.status(200).json(updatedQualification);
        // Redirect to staff update page with "Qualification Successfully Updated" msg
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error updating qualification");
        // Redirect to staff update page with "Error Updating Qualification" msg
    }
});

// Add new Tips(mini videos) 
router.post('/staff/add-tips', checkSchema(tipsValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const data = matchedData(req);  // Grab data posted from client side.
    //const username = req.session.username;  -> Remove username form validation

    try {
        // Check if the staff member exists in the database
        // const staffMember = await Models.Staff.findOne({
        //     where: { username }
        // });

        // if (!staffMember) {
        //     return res.status(404).json({ error: "Staff member not found" });
        // }

        const subject = await Models.Subject.findOne({      // Check if the subject exists in the database
            where: { sub_id: data.sub_id }
        });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        const newTip = await Models.Tip.create({          // Create the new tip 
            title: data.title,
            sub_id: data.sub_id,
            username: data.username,     // After set login -> username: username  and remove username from validation
            source: data.source
        });

        return res.status(201).json(newTip); 

    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).send({error : error});
    }
});

// Add new Books
router.post("/staff/add-books", checkSchema(booksValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const data = matchedData(req); 
    //const username = req.session.username;       -> Remove username form validation

    try {
        const subject = await Models.Subject.findOne({     // Check if the subject exists
            where: { sub_id: data.sub_id },
        });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        const staffMember = await Models.Staff.findOne({    // Check if the user (staff member) exists
            where: { username: data.username },
        });
        if (!staffMember) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        const lastBook = await Models.Book.findOne({        // Get the last book's reg_no for the given sub_id
            where: { sub_id: data.sub_id },
            order: [['book_id', 'DESC']],                   // Ordering by reg_no in descending order
        });

        // Generate the new book_id using extractBookId
        let newBookId;
        if (lastBook && lastBook.book_id) {
            const lastBookNo = extractBookId(lastBook.book_id, data.sub_id);
            newBookId = bookId(data.sub_id, lastBookNo);
        } else {
            newBookId = bookId(data.sub_id, 0); // Generate a new book ID when no books exist for the subject
        }

        const newBook = await Models.Book.create({  // Create the new book entry
            book_id: newBookId,
            title: data.title,
            sub_id: data.sub_id,
            author: data.author,
            username: data.username,        // After set login -> username: username  and remove username from validation
            image: data.image,
            source: data.source
        });

        return res.status(201).json(newBook); // Return the newly created book

    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).json({ error: error });
    }
});

// Add new Blog
router.post("/staff/add-blogs", checkSchema(blogValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const data = matchedData(req); 
    //const username = req.session.username;       -> Remove username form validation

    try {
        const staffMember = await Models.Staff.findOne({  // Check if the user (staff member) exists
            where: { username: data.username },          // -> username: username 
        });
        if (!staffMember) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        const newBlog = await Models.Blog.create({  // Create the new blog
            title: data.title,
            username: data.username,        // After set login -> username: username  and remove username from validation
            image: data.image,
            content: data.content
        });

        return res.status(201).json(newBlog); // Return the newly created book

    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).json({ error: error });
    }
});


export default router;
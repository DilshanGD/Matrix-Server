// Backend/src/routes/common.mjs

import { Router } from "express";
import Models from "../db/models.mjs";
//import { isAuth } from "../utils/middleware.mjs";    // Authentication middleware

const router = Router();

// Log out api
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if(err)
            throw err;
        //return res.status(200).redirect("/");            // After logged out forward to home page
        return res.send(`Logged Out`);
    })
})

// Home page api
router.get("/", async (req, res) => { 
    try {
        const findImage = await Models.Front_Detail.findAll({   // Find all images in home page
            where: { type: 'home' },
            attributes: ['detail_id', 'file_path']
        });  

        const findStream = await Models.Stream.findAll({       // Find all streams
            attributes: ['stream_id', 'title']
        });

        const staffByStream = await Models.Staff.findAll({     // Find all staff with their respected streams
            include: [
                {
                    model: Models.Subject,
                    include: [
                        {
                            model: Models.Stream,
                            attributes: ['stream_id', 'title'],
                        }
                    ],
                    attributes: ['title'],
                }
            ],
            attributes: ['username', 'full_name', 'email'],
        });

        // Grouping the staff by streams
        const staffGroups = staffByStream.reduce((acc, staff) => {
            const subject = staff.Subject; 
            if (subject && subject.Streams && subject.Streams.length > 0) {
                subject.Streams.forEach((stream) => {         // Iterate over each stream in the Subject
                    const streamId = stream.stream_id;        // Get the stream_id
                    
                    if (!acc[streamId]) {
                        acc[streamId] = []; 
                    }
        
                    // Push the staff member's details to the corresponding stream group
                    acc[streamId].push({
                        username: staff.username,
                        full_name: staff.full_name,
                        email: staff.email,
                        subject_title: subject.title
                    });
                });
            }
            return acc; // Return the accumulator for the next iteration
        }, {});
        
        const [classCount, staffCount, studentCount] = await Promise.all([  // Find no.of Class,Staff members and Students
            Models.Class.count(),
            Models.Staff.count(),
            Models.Student.count()
        ]);

        return res.status(200).send({
            homeImages: findImage,
            streams: findStream,
            staffGroups: staffGroups,
            statistics: {
                totalClasses: classCount,
                totalStaff: staffCount,
                totalStudents: studentCount
            }
        });
    } catch (err) {
        console.error(err); // Log the entire error for better debugging
        return res.status(500).send({ error: err });
    }
});

// Staff page api
router.get("/staff", async (req, res) => { 
    try {
        const staffByStream = await Models.Staff.findAll({   // Find all staff with their respected streams
            include: [
                {
                    model: Models.Subject,
                    include: [
                        {
                            model: Models.Stream,
                            attributes: ['stream_id', 'title'],
                        }
                    ],
                    attributes: ['title'],
                }
            ],
            attributes: ['username', 'full_name', 'email', 'profile_pic'],
        });

        const staffGroups = staffByStream.reduce((acc, staff) => {    // Grouping the staff by streams and subjects
            const subject = staff.Subject; 
            const streams = subject?.Streams ?? [];

            streams.forEach((stream) => {
                const streamId = stream.stream_id; 
                const streamTitle = stream.title;

                if (!acc[streamId]) {                 // Initialize the stream group if it doesn't exist
                    acc[streamId] = {  
                        title: streamTitle,          // Store the title of the stream
                        subjects: {}                 // Prepare to group by subjects
                    };
                }

                if (!acc[streamId].subjects[subject.title]) {    // Initialize the subject group if it doesn't exist
                    acc[streamId].subjects[subject.title] = [];  // Initialize an array for the staff in this subject
                }

                acc[streamId].subjects[subject.title].push({    // Push the staff member's details to the corresponding subject group
                    username: staff.username,
                    full_name: staff.full_name,
                    email: staff.email,
                    profile_pic: staff.profile_pic
                });
            });
            return acc; // Return the accumulator for the next iteration
        }, {});
        
        return res.status(200).send({ staffGroups });
    } catch (err) {
        console.error("Error processing request:", err);
        return res.status(500).send({ error:err });
    }
});

// Tips page api
// router.get("/tips", async (req, res) => {
//     try {
//         const tips = await Models.Tip.findAll({
//             include: [
//                 {
//                     model: Models.Subject,  // Include the Subject model
//                     attributes: ['title'],  // Only get the title of the subject
//                     include: [
//                         {
//                             model: Models.Stream,  // Include the Stream model
//                             attributes: []  // We don't need the stream attributes
//                         }
//                     ]
//                 },
//                 {
//                     model: Models.Staff,  // Include the Staff model
//                     attributes: ['full_name']  // Only get the full_name of the staff
//                 }
//             ],
//             attributes: ['tip_id', 'title', 'source'],  // Only get the tip_id and title from Tips
//         });

//         if (tips.length === 0) {             // Check if tips are found
//             return res.status(404).send({ message: "No tips found" });
//         }

//         const tipList = tips.map(tip => ({   // Map the tips to only return the required data
//             tip_id: tip.tip_id,
//             title: tip.title,
//             subject_title: tip.Subject.title,
//             full_name: tip.Staff.full_name,
//             source: tip.source
//         }));

//         // Respond with the filtered data
//         return res.status(200).json(tipList);
//     } catch (err) {
//         console.error("Error processing request:", err);
//         return res.status(500).send({ error: err.message });
//     }
// });
router.get("/tips", async (req, res) => {
    try {
        const tips = await Models.Tip.findAll({
            include: [
                {
                    model: Models.Subject,
                    attributes: ['title'],
                    include: [
                        {
                            model: Models.Stream,
                            attributes: []
                        }
                    ]
                },
                {
                    model: Models.Staff,
                    attributes: ['full_name']
                }
            ],
            attributes: ['tip_id', 'title', 'source', 'createdAt'],  // Include createdAt
            order: [['createdAt', 'DESC']],  // Sort by createdAt in descending order (latest first)
        });

        // Map the tips to only return the required data, including createdAt
        const tipList = tips.map(tip => ({
            tip_id: tip.tip_id,
            title: tip.title,
            subject_title: tip.Subject?.title || "No subject assigned",
            full_name: tip.Staff?.full_name || "No instructor assigned",
            source: tip.source,
            createdAt: tip.createdAt  // Include createdAt in the response
        }));

        // Ensure a consistent array response, even if no tips are found
        return res.status(200).json({ tips: tipList });
    } catch (err) {
        console.error("Error processing request:", err);
        return res.status(500).json({ error: "An error occurred while fetching tips." });
    }
});

// Fetch navigation details
router.get('/navbar', async (req, res) => {
    try {
        const navDetails = await Models.Front_Detail.findAll({
            where: { type: 'nav' },
        });

        if (navDetails.length === 0) {
            return res.status(404).send({ message: "No navigation details found" });
        }
        console.log(navDetails);
        console.log(navDetails);
        return res.status(200).json(navDetails);
    } catch (err) {
        console.error("Error fetching navbar details:", err);
        return res.status(500).send({ error: err.message });
    }
});

// Library page api
// router.get("/library", async (req, res) => { 
//     try {
//         const booksBySubject = await Models.Book.findAll({    // Find all books along with their respective subjects
//             include: [
//                 {
//                     model: Models.Subject,
//                     attributes: ['title'],                   // Include only the subject title
//                 }
//             ],
//             attributes: ['book_id', 'title', 'author', 'image', 'source'], // Only include required fields for books
//         });

//         const bookGroups = booksBySubject.reduce((acc, book) => {          // Group books by subject title
//             const subjectTitle = book.Subject?.title ?? "Unknown Subject"; // Get the subject title

//             if (!acc[subjectTitle]) {      // If this subject doesn't have a group, create one
//                 acc[subjectTitle] = [];
//             }

//             acc[subjectTitle].push({     // Push the book details into the appropriate subject group
//                 book_id: book.book_id,
//                 title: book.title,
//                 author: book.author,
//                 image: book.image,
//                 source: book.source
//             });

//             return acc;                   // Return the accumulator for the next iteration
//         }, {});

//         return res.status(200).send(bookGroups);
//     } catch (err) {
//         console.error("Error is:", err);
//         return res.status(500).send({ error: err });
//     }
// });
// router.get("/library", async (req, res) => { 
//     try {
//         const booksBySubject = await Models.Book.findAll({  // Find all books with their respective subjects
//             include: [
//                 {
//                     model: Models.Subject,  // Include the Subject model
//                     include: [
//                         {
//                             model: Models.Stream,  // Include the Stream model for subject-stream mapping
//                             attributes: ['stream_id', 'title'],  // Include stream_id and stream title
//                         }
//                     ],
//                     attributes: ['title'],  // Include only the subject title
//                 }
//             ],
//             attributes: ['book_id', 'title', 'author', 'image', 'source'],  // Include only the necessary book fields
//         });

//         // Group books by stream and subject
//         const bookGroups = booksBySubject.reduce((acc, book) => {
//             const subject = book.Subject; 
//             const streams = subject?.Streams ?? [];  // Handle missing Streams

//             // Iterate over streams and group books accordingly
//             streams.forEach((stream) => {
//                 const streamId = stream.stream_id; 
//                 const streamTitle = stream.title;

//                 // Initialize stream group if it doesn't exist
//                 if (!acc[streamId]) {                 
//                     acc[streamId] = {  
//                         title: streamTitle,         // Store the title of the stream
//                         subjects: {}                // Prepare to group by subjects
//                     };
//                 }

//                 // Initialize subject group within the stream if it doesn't exist
//                 if (!acc[streamId].subjects[subject.title]) {    
//                     acc[streamId].subjects[subject.title] = [];  // Initialize an array for books in this subject
//                 }

//                 // Push the book details to the corresponding subject group
//                 acc[streamId].subjects[subject.title].push({    
//                     book_id: book.book_id,
//                     title: book.title,
//                     author: book.author,
//                     image: book.image,
//                     source: book.source
//                 });
//             });
//             return acc; // Return the accumulator for the next iteration
//         }, {});

//         return res.status(200).send({ bookGroups });  // Return the grouped books
//     } catch (err) {
//         // Improved error handling with detailed logging
//         console.error("Error processing library data:", err.message);
//         return res.status(500).send({ error: "An error occurred while fetching library data. Please try again later." });
//     }
// });
// router.get("/library", async (req, res) => { 
//     const limit = 8;

//     try {
//         const booksBySubject = await Models.Book.findAll({
//             include: [
//                 {
//                     model: Models.Subject,
//                     attributes: ['sub_id','title'],
//                     include: [
//                         {
//                             model: Models.Stream,
//                             attributes: ['stream_id', 'title'],
//                         }
//                     ]
//                 }
//             ],
//             attributes: ['book_id', 'title', 'author', 'image', 'source', 'createdAt'],
//             order: [['createdAt', 'DESC']],  // Sort by latest createdAt
//         });

//         const initialBookGroups = booksBySubject.reduce((acc, book) => {
//             const subject = book.Subject;
//             const streams = subject?.Streams ?? [];

//             streams.forEach((stream) => {
//                 const streamId = stream.stream_id;
//                 const streamTitle = stream.title;

//                 if (!acc[streamId]) {
//                     acc[streamId] = { title: streamTitle, subjects: {} };
//                 }

//                 if (!acc[streamId].subjects[subject.title]) {
//                     acc[streamId].subjects[subject.title] = [];
//                 }

//                 // Only add books up to the specified limit per subject, ensuring latest first
//                 if (acc[streamId].subjects[subject.title].length < limit) {
//                     acc[streamId].subjects[subject.title].push({
//                         sub_id: book.sub_id,
//                         book_id: book.book_id,
//                         title: book.title,
//                         author: book.author,
//                         image: book.image,
//                         source: book.source,
//                         createdAt: book.createdAt,
//                     });
//                 }
//             });

//             return acc;
//         }, {});

//         return res.status(200).json({ initialBookGroups });
//     } catch (err) {
//         console.error("Error fetching initial library data:", err.message);
//         return res.status(500).send({ error: "Failed to fetch initial library data. Please try again later." });
//     }
// });
router.get("/library", async (req, res) => { 
    const limit = 8;

    try {
        const booksBySubject = await Models.Book.findAll({
            include: [
                {
                    model: Models.Subject,
                    attributes: ['sub_id','title'],
                    include: [
                        {
                            model: Models.Stream,
                            attributes: ['stream_id', 'title'],
                        }
                    ]
                }
            ],
            attributes: ['book_id', 'title', 'author', 'image', 'source', 'createdAt'],
            order: [['createdAt', 'DESC']],  // Sort by latest createdAt
        });

        const initialBookGroups = booksBySubject.reduce((acc, book) => {
            const subject = book.Subject;
            const streams = subject?.Streams ?? [];

            streams.forEach((stream) => {
                const streamId = stream.stream_id;
                const streamTitle = stream.title;

                // Initialize stream in the accumulator if it doesn't exist
                if (!acc[streamId]) {
                    acc[streamId] = { title: streamTitle, subjects: {} };
                }

                // Initialize subject within the stream if it doesn't exist
                if (!acc[streamId].subjects[subject.title]) {
                    acc[streamId].subjects[subject.title] = {
                        sub_id: subject.sub_id,
                        books: []
                    };
                }

                // Add book details to the subject's book array, respecting the limit
                if (acc[streamId].subjects[subject.title].books.length < limit) {
                    acc[streamId].subjects[subject.title].books.push({
                        book_id: book.book_id,
                        title: book.title,
                        author: book.author,
                        image: book.image,
                        source: book.source,
                        createdAt: book.createdAt,
                    });
                }
            });

            return acc;
        }, {});

        return res.status(200).json({ initialBookGroups });
    } catch (err) {
        console.error("Error fetching initial library data:", err.message);
        return res.status(500).send({ error: "Failed to fetch initial library data. Please try again later." });
    }
});

// Subject Library api
// router.get("/library/subject/:subjectTitle", async (req, res) => { 
//     const { subjectTitle } = req.params;
//     const { page = 1, limit = 8 } = req.query;

//     try {
//         const books = await Models.Book.findAndCountAll({
//             include: [
//                 {
//                     model: Models.Subject,
//                     where: { title: subjectTitle },
//                     attributes: [],
//                     include: [
//                         {
//                             model: Models.Stream,
//                             attributes: ['title'], 
//                         }
//                     ]
//                 }
//             ],
//             attributes: ['book_id', 'title', 'author', 'image', 'source', 'createdAt'],
//             order: [['createdAt', 'DESC']],  // Sort by latest createdAt
//             offset: (page - 1) * limit,
//             limit: parseInt(limit),
//         });

//         return res.status(200).json({
//             subjectTitle,
//             totalBooks: books.count,
//             totalPages: Math.ceil(books.count / limit),
//             currentPage: parseInt(page),
//             books: books.rows,
//         });
//     } catch (err) {
//         console.error("Error is:", err.message);
//         return res.status(500).send({ error: err });
//     }
// });
// Endpoint to fetch books by subject with pagination
router.get("/library/subject/:subtitle", async (req, res) => {
    const { subtitle } = req.params; // Get subtitle from URL params (URL will contain "Information Technology" or any other subject)
    const { sub_id, page = 1, limit = 8 } = req.query; // Get sub_id from query params (e.g., ?sub_id=ICT)
    
    // Log incoming parameters for debugging
    console.log("Received subtitle:", subtitle);
    console.log("Received sub_id from query:", sub_id);
    
    // Convert page and limit to integers and validate them
    const pageInt = parseInt(page);
    const limitInt = Math.min(parseInt(limit), 100); // Set a max limit of 100 books per page
  
    // Validate sub_id, page, and limit
    if (!sub_id || typeof sub_id !== 'string') {
      return res.status(400).json({ error: "Invalid or missing subject ID in query" });
    }
    if (isNaN(pageInt) || pageInt < 1) {
      return res.status(400).json({ error: "Page must be a positive integer" });
    }
    if (isNaN(limitInt) || limitInt < 1) {
      return res.status(400).json({ error: "Limit must be a positive integer" });
    }
  
    try {
      // Fetch books that belong to the subject identified by sub_id (from query) and subtitle (from URL)
      const books = await Models.Book.findAndCountAll({
        include: [
          {
            model: Models.Subject,
            where: { sub_id }, // Filter books by sub_id (query parameter)
            required: true, // Ensure only books belonging to this subject are included
          }
        ],
        attributes: ['book_id', 'title', 'author', 'image', 'source', 'createdAt'], // Specify attributes to retrieve
        order: [['createdAt', 'DESC']], // Sort books by latest
        offset: (pageInt - 1) * limitInt, // Calculate offset for pagination
        limit: limitInt, // Set the limit for books per page
      });
  
      // If no books are found, return a 404 status
      if (books.count === 0) {
        return res.status(404).json({ message: "No books found for this subject" });
      }
  
      // Return paginated books and metadata
      return res.status(200).json({
        subtitle, // Include subtitle in the response (for clarity)
        sub_id, // Include sub_id from query in the response
        totalBooks: books.count, // Total number of books in the subject
        totalPages: Math.ceil(books.count / limitInt), // Total number of pages based on limit
        currentPage: pageInt, // Current page number
        books: books.rows, // Books data for the current page
      });
    } catch (err) {
      // Log the error for debugging and return a 500 status
      console.error("Error fetching books for sub_id:", sub_id, " - Error:", err.message);
      return res.status(500).json({ error: "An error occurred while fetching books" });
    }
});
  








// Blog page api
router.get("/blogs", async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;  // Default to page 1 and limit 10 blogs per page
        const offset = (page - 1) * limit;  // Calculate offset based on page

        // Fetch the total number of blogs for pagination
        const totalBlogs = await Models.Blog.count();

        // Fetch the blogs with pagination
        const blogs = await Models.Blog.findAll({
            include: [
                {
                    model: Models.Staff,  // Include the Staff model
                    attributes: ['full_name']  // Only get the full_name of the staff
                }
            ],
            attributes: ['id', 'title', 'content', 'image', 'createdAt'],  // Include required blog fields
            order: [['createdAt', 'DESC']],  // Order blogs by createdAt in descending order (latest first)
            limit,  // Limit the number of blogs per page
            offset,  // Skip the appropriate number of blogs based on the current page
        });

        if (blogs.length === 0) {  // Check if blogs are found
            return res.status(404).send({ message: "No blogs found" });
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalBlogs / limit);

        // Map the blogs to only return the required data
        const blogList = blogs.map(blog => ({
            blog_id: blog.id,
            title: blog.title,
            content: blog.content,
            image: blog.image,
            createdAt: blog.createdAt,
            full_name: blog.Staff.full_name
        }));

        // Respond with the filtered data and pagination info
        return res.status(200).json({
            blogs: blogList,
            totalPages  // Return total pages for pagination
        });

    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send({ error: err.message });
    }
});






export default router;
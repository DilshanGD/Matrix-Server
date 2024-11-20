// Backend/src/utils/staffDetailsValidation.mjs

// Staff registration validation
export const staffValidation = {
    username: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "usernameLength"
        },
        notEmpty: {
            errorMessage: "usernameEmpty"
        }
    },
    full_name: {
        isLength: {
            options: {
                min: 5,
                max: 32
            },
            errorMessage: "nameLength"
        },
        notEmpty: {
            errorMessage: "nameEmpty"
        },
        isString: {
            errorMessage: "nameString"
        }
    },
    email: {
        isEmail: {
            errorMessage: "isEmail"
        },
        notEmpty: {
            errorMessage: "emailEmpty"
        }
    },
    gender: {
        notEmpty: {
            errorMessage: "genderEmpty"
        },
        isString: {
            errorMessage: "genderString"
        }
    },
    sub_id: {
        isLength: {
            options: {
                min: 3,
                max: 8
            },
            errorMessage: "subLength"
        },
        notEmpty: {
            errorMessage: "subEmpty"
        }
    }
};

// Staff update validation
export const staffUpdateValidation = {
    username: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "usernameLenght"
        },
        notEmpty: {
            errorMessage: "usernameEmpty"
        }
    },
    full_name: {
        isLength: {
            options: {
                min: 5,
                max: 32
            },
            errorMessage: "nameLength"
        },
        notEmpty: {
            errorMessage: "nameEmpty"
        },
        isString: {
            errorMessage: "nameString"
        }
    },
    email: {
        isEmail: {
            errorMessage: "isEmail"
        },
        notEmpty: {
            errorMessage: "emailEmpty"
        }
    },
    sub_id: {
        isLength: {
            options: {
                min: 3,
                max: 8
            },
            errorMessage: "subLenght"
        },
        notEmpty: {
            errorMessage: "subEmpty"
        }
    },
    gender: {
        notEmpty: {
            errorMessage: "genderEmpty"
        },
        isString: {
            errorMessage: "genderString"
        }
    },
    phoneHome: {
        optional: true,
        isLength: {
            options: {
                min: 10,
                max: 12
            },
            errorMessage: "homePhoneLength"
        },
        isString: {
            errorMessage: "homePhoneString"
        }
    },
    phoneMobile: {
        optional: true,
        isLength: {
            options: {
                min: 10,
                max: 12
            },
            errorMessage: "mobilePhoneLength"
        },
        isString: {
            errorMessage: "mobilePhoneString"
        }
    },
    profile_pic: {
        optional: true,
        isString: {
            errorMessage: "picString"
        }
    }
};

// Staff login validation
export const staffLoginValidation = {
    email: {
        isEmail: {
            errorMessage: "isEmail"
        },
        notEmpty: {
            errorMessage: "emailEmpty"
        }
    },
    pwd: {
        notEmpty: {
            errorMessage: "pwdEmpty"
        },
        isString: {
            errorMessage: "pwdString"
        }
    }
};

// Staff biography update validation
export const staffBiographyValidation = {
    biography: {
        notEmpty: {
            errorMessage: "biographyEmpty"
        },
        isString: {
            errorMessage: "biographyString"
        },
        isLength: {
            options: { max: 1000 }, // Optional: limit the length if needed
            errorMessage: "biographyLength"
        }
    }
};

// Staff qualification validation
export const staffQualificationValidation = {
    title: {
        notEmpty: {
            errorMessage: "titleEmpty"
        },
        isString: {
            errorMessage: "titleString"
        }
    },
    type: {
        notEmpty: {
            errorMessage: "typeEmpty"
        },
        isIn: {
            options: [['ug', 'pg']],
            errorMessage: "Type must be either 'ug' or 'pg'"
        }
    },
    institute: {
        optional: true,
        isString: {
            errorMessage: "instituteString"
        }
    }
};

// Staff qualification update validation
export const staffQualificationUpdateValidation = {
    title: {
        notEmpty: {
            errorMessage: "titleEmpty"
        },
        isString: {
            errorMessage: "titleString"
        }
    },
    type: {
        notEmpty: {
            errorMessage: "typeEmpty"
        },
        isIn: {
            options: [['ug', 'pg']],
            errorMessage: "Type must be either 'ug' or 'pg'"
        }
    },
    institute: {
        optional: true,
        isString: {
            errorMessage: "instituteString"
        }
    }
};

// Tips(mini video) validation
export const tipsValidation = {
    username: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "usernameLength"
        },
        notEmpty: {
            errorMessage: "usernameEmpty"
        }
    },
    title: {
        isLength: {
            options: {
                min: 5,
                max: 50
            },
            errorMessage: "titleLength"
        },
        notEmpty: {
            errorMessage: "titleEmpty"
        },
        isString: {
            errorMessage: "titleString"
        }
    },
    sub_id: {
        isLength: {
            options: {
                min: 3,
                max: 8
            },
            errorMessage: "subLength"
        },
        notEmpty: {
            errorMessage: "subEmpty"
        },
        isString: {
            errorMessage: "subString"
        }
    },
    source: {
        isLength: {
            options: {
                min: 3,
                max: 200
            },
            errorMessage: "sourceLength"
        },
        notEmpty: {
            errorMessage: "sourceEmpty"
        },
        isString: {
            errorMessage: "sourceString"
        }
    }
};

// Books validation
export const booksValidation = {
    username: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "usernameLength"
        },
        notEmpty: {
            errorMessage: "usernameEmpty"
        }
    },
    title: {
        isLength: {
            options: {
                min: 5,
                max: 50
            },
            errorMessage: "titleLength"
        },
        notEmpty: {
            errorMessage: "titleEmpty"
        },
        isString: {
            errorMessage: "titleString"
        }
    },
    sub_id: {
        isLength: {
            options: {
                min: 3,
                max: 8
            },
            errorMessage: "subLength"
        },
        notEmpty: {
            errorMessage: "subEmpty"
        },
        isString: {
            errorMessage: "subString"
        }
    },
    source: {
        isLength: {
            options: {
                min: 3,
                max: 200
            },
            errorMessage: "sourceLength"
        },
        notEmpty: {
            errorMessage: "sourceEmpty"
        },
        isString: {
            errorMessage: "sourceString"
        }
    },
    image: {
        isLength: {
            options: {
                min: 3,
                max: 200
            },
            errorMessage: "imageLength"
        },
        notEmpty: {
            errorMessage: "imageEmpty"
        },
        isString: {
            errorMessage: "imageString"
        }
    },
    author: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "authorLength"
        },
        notEmpty: {
            errorMessage: "authorEmpty"
        }
    }
};

// Blog validation
export const blogValidation = {
    username: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "usernameLength"
        },
        notEmpty: {
            errorMessage: "usernameEmpty"
        }
    },
    title: {
        isLength: {
            options: {
                min: 5,
                max: 50
            },
            errorMessage: "titleLength"
        },
        notEmpty: {
            errorMessage: "titleEmpty"
        },
        isString: {
            errorMessage: "titleString"
        }
    },
    content: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "contentLength"
        },
        notEmpty: {
            errorMessage: "contentEmpty"
        },
        isString: {
            errorMessage: "contentString"
        }
    },
    image: {
        isLength: {
            options: {
                min: 3,
                max: 200
            },
            errorMessage: "imageLength"
        },
        notEmpty: {
            errorMessage: "imageEmpty"
        },
        isString: {
            errorMessage: "imageString"
        }
    }
};

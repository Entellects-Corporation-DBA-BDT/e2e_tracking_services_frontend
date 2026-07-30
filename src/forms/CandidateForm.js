import React, { useState, useEffect } from "react";
import "./CandidateForm.css";

import {
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiBriefcase,
    FiFileText,
    FiUpload,
    FiGlobe,
    FiCheckCircle,
    FiAlertCircle
} from "react-icons/fi";

import {
    createCandidate,
    updateCandidate,
    getCandidateById
} from "../api/candidateApi";

const CandidateForm = ({
    onClose,
    candidateId,
    isEdit = false,
    refreshData
}) => {

    const [loading, setLoading] = useState(false);

    const [resume, setResume] = useState(null);

    const [dragActive, setDragActive] = useState(false);

    const [existingResume, setExistingResume] = useState("");

    const [errors, setErrors] = useState({});

    const [submitError, setSubmitError] = useState("");

    const [formData, setFormData] = useState({

        name: "",

        email: "",

        phone: "",

        current_location: "",

        visa_status: "",

        skills: "",

        remarks: "",

        status: "Active"

    });

    useEffect(() => {

        if (!isEdit || !candidateId) return;

        loadCandidate();

    }, [candidateId]);

    const loadCandidate = async () => {

        try {

            const response = await getCandidateById(candidateId);

            const candidate = response.data;

            setFormData({

                name: candidate.name || "",

                email: candidate.email || "",

                phone: candidate.phone || "",

                current_location: candidate.current_location || "",

                visa_status: candidate.visa_status || "",

                skills: candidate.skills || "",

                remarks: candidate.remarks || "",

                status: candidate.status || "Active"

            });

            setExistingResume(candidate.resume_path || "");

        } catch (err) {

            console.log(err);

        }

    };
    const validate = () => {

        const newErrors = {};

        if (!formData.name.trim())
            newErrors.name = "Candidate name is required";

        if (!formData.email.trim())
            newErrors.email = "Email is required";

        if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = "Enter valid email";

        if (!formData.phone.trim())
            newErrors.phone = "Phone number is required";

        if (!formData.current_location.trim())
            newErrors.current_location = "Location is required";

        if (!isEdit && !resume)
            newErrors.resume = "Resume is required";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;

    };

        const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({

            ...prev,

            [name]: value

        }));

        if (errors[name]) {

            setErrors((prev) => ({

                ...prev,

                [name]: ""

            }));

        }

    };

        const handleResume = (e) => {

        if (!e.target.files.length) return;

        setResume(e.target.files[0]);

    };

        const handleDrop = (e) => {

        e.preventDefault();

        setDragActive(false);

        if (!e.dataTransfer.files.length) return;

        setResume(e.dataTransfer.files[0]);

    };

    const handleDragOver = (e) => {

        e.preventDefault();

        setDragActive(true);

    };

    const handleDragLeave = () => {

        setDragActive(false);

    };

        const handleSubmit = async (e) => {

        e.preventDefault();

        if (loading) return;

        if (!validate()) return;

        setLoading(true);

        setSubmitError("");

        try {

            const payload = new FormData();

            Object.keys(formData).forEach((key) => {

                payload.append(key, formData[key]);

            });

            if (resume) {

                payload.append("resume_file", resume);

            }

            let response;

            if (isEdit) {

                response = await updateCandidate(candidateId, payload);

            } else {

                response = await createCandidate(payload);

            }

            await refreshData?.();

            if (response?.warning) {
                alert(response.warning);
            }

            onClose();

        } catch (err) {

            setSubmitError(
                err?.response?.data?.message ||
                err?.message ||
                `Failed to ${isEdit ? "update" : "create"} candidate.`
            );

        } finally {

            setLoading(false);

        }

    };

        return (

        <div className="candidate-page">

            <div className="candidate-card">

                {/* HEADER */}

                <div className="candidate-header">
                        <h2>
                            {isEdit
                                ? "Edit Candidate"
                                : "Add Candidate"}
                        </h2>
                </div>

                <form onSubmit={handleSubmit}>

                    {submitError && (
                        <div role="alert" className="candidate-submit-error">
                            <FiAlertCircle /> {submitError}
                        </div>
                    )}
                  
                                      <div className="section">

                        <div className="section-title">

                            <FiUser />

                            Personal Information

                        </div>

                        <div className="candidate-grid">

                            {/* Name */}

                            <div className="form-group">

                                <label>

                                    Candidate Name

                                </label>

                                <div className="input-box">

                                    <FiUser />

                                    <input

                                        name="name"

                                        value={formData.name}

                                        onChange={handleChange}

                                        placeholder="Enter candidate name"

                                    />

                                </div>

                                {errors.name && (

                                    <small>{errors.name}</small>

                                )}

                            </div>

                            {/* Email */}

                            <div className="form-group">

                                <label>

                                    Email Address

                                </label>

                                <div className="input-box">

                                    <FiMail />

                                    <input

                                        type="email"

                                        name="email"

                                        value={formData.email}

                                        onChange={handleChange}

                                        placeholder="Enter email"

                                    />

                                </div>

                                {errors.email && (

                                    <small>{errors.email}</small>

                                )}

                            </div>

                            {/* Phone */}

                            <div className="form-group">

                                <label>

                                    Phone Number

                                </label>

                                <div className="input-box">

                                    <FiPhone />

                                    <input

                                        name="phone"

                                        value={formData.phone}

                                        onChange={handleChange}

                                        placeholder="Phone Number"

                                    />

                                </div>

                                {errors.phone && (

                                    <small>{errors.phone}</small>

                                )}

                            </div>

                            {/* Location */}

                            <div className="form-group">

                                <label>

                                    Current Location

                                </label>

                                <div className="input-box">

                                    <FiMapPin />

                                    <input

                                        name="current_location"

                                        value={formData.current_location}

                                        onChange={handleChange}

                                        placeholder="Current Location"

                                    />

                                </div>

                                {errors.current_location && (

                                    <small>{errors.current_location}</small>

                                )}

                            </div>

                            {/* Visa */}

                            <div className="form-group">

                                <label>

                                    Visa Status

                                </label>

                                <div className="input-box">

                                    <FiGlobe />

                                    <select

                                        name="visa_status"

                                        value={formData.visa_status}

                                        onChange={handleChange}

                                    >

                                        <option value="">Select</option>

                                        <option>H1B</option>

                                        <option>OPT</option>

                                        <option>CPT</option>

                                        <option>GC</option>

                                        <option>Citizen</option>

                                    </select>

                                </div>

                            </div>

                        </div>

                    </div>

                                        {/* ========================================= */}
                    {/* PROFESSIONAL INFORMATION */}
                    {/* ========================================= */}

                    <div className="section">

                        <div className="section-title">

                            <FiBriefcase />

                            Professional Information

                        </div>

                        <div className="form-group">

                            <label>

                                Technical Skills

                            </label>

                            <div className="input-box textarea-box">


                                <textarea

                                    rows={5}

                                    name="skills"

                                    value={formData.skills}

                                    onChange={handleChange}

                                    placeholder="Example: React, Node.js, Java, Spring Boot, AWS, Docker..."

                                />

                            </div>

                            <div className="field-info">

                                Separate skills with commas.

                            </div>

                        </div>

                    </div>

                    {/* ========================================= */}
                    {/* RESUME */}
                    {/* ========================================= */}

                    <div className="section">

                        <div className="section-title">

                            <FiFileText />

                            Resume

                        </div>

                        {

                            isEdit && existingResume && (

                                <div className="current-resume">

                                    <div className="resume-left">

                                        <FiCheckCircle />

                                        <div>

                                            <h4>

                                                Current Resume

                                            </h4>

                                            <span>

                                                {existingResume}

                                            </span>

                                        </div>

                                    </div>

                                </div>

                            )

                        }

                        <label

                            className={`upload-box ${dragActive ? "active" : ""}`}

                            onDrop={handleDrop}

                            onDragOver={handleDragOver}

                            onDragLeave={handleDragLeave}

                        >

                            <input

                                type="file"

                                hidden

                                accept=".pdf,.doc,.docx"

                                onChange={handleResume}

                            />

                            <div className="upload-content">

                                <div className="upload-circle">

                                    <FiUpload />

                                </div>

                                <h3>

                                    {

                                        isEdit

                                            ? "Replace Resume"

                                            : "Upload Resume"

                                    }

                                </h3>

                                <p>

                                    Drag & Drop your resume here

                                </p>

                                <span>

                                    or click to browse

                                </span>

                                {

                                    resume && (

                                        <div className="selected-file">

                                            <FiCheckCircle />

                                            {resume.name}

                                        </div>

                                    )

                                }

                                {

                                    errors.resume && (

                                        <small>

                                            <FiAlertCircle />

                                            {errors.resume}

                                        </small>

                                    )

                                }

                            </div>

                        </label>

                    </div>

                    {/* ========================================= */}
                    {/* REMARKS */}
                    {/* ========================================= */}

                    <div className="section">

                        <div className="section-title">

                            <FiFileText />

                            Additional Remarks

                        </div>

                        <div className="form-group">

                            <textarea

                                rows={6}

                                name="remarks"

                                value={formData.remarks}

                                onChange={handleChange}

                                placeholder="Write additional notes about the candidate..."

                            />

                            <div className="remarks-count">

                                {formData.remarks.length}/500

                            </div>

                        </div>

                    </div>

                    {/* ========================================= */}
                    {/* FOOTER */}
                    {/* ========================================= */}

                    <div className="candidate-footer">

                        <button

                            type="button"

                            className="cancel-btn"

                            onClick={onClose}

                        >

                            Cancel

                        </button>

                        <button

                            type="submit"

                            className="save-btn"

                            disabled={loading}

                        >

                            {

                                loading

                                    ? (

                                        <>

                                            <span className="loader"></span>

                                            {

                                                isEdit

                                                    ? "Updating Candidate..."

                                                    : "Saving Candidate..."

                                            }

                                        </>

                                    )

                                    : (

                                        <>

                                            <FiCheckCircle />

                                            {

                                                isEdit

                                                    ? "Update Candidate"

                                                    : "Save Candidate"

                                            }

                                        </>

                                    )

                            }

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};

export default CandidateForm;

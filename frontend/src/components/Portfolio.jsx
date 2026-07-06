import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Header from "./Header";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function Portfolio() {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState({});

  const loadPortfolioData = async () => {
    try {
      const url = identifier ? `/portfolio/${identifier}` : "/portfolio/my/portfolio";
      const response = await API.get(url);
      setPortfolio(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load portfolio"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [identifier]);

  const downloadPDF = async () => {
    if (exporting) return;
    setExporting(true);

    const element = document.querySelector(".portfolio-container");
    if (!element) {
      alert("Portfolio content not found");
      setExporting(false);
      return;
    }

    try {
      element.classList.add("pdf-print-mode");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      element.classList.remove("pdf-print-mode");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210;
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${portfolio.fullName.replace(/\s+/g, "_")}_Portfolio.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      element.classList.remove("pdf-print-mode");
      setExporting(false);
    }
  };

  const handleLike = async () => {
    try {
      await API.post(`/portfolio/${portfolio._id}/like`);
      loadPortfolioData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle like");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await API.post(`/portfolio/${portfolio._id}/comment`, { text: commentText });
      setCommentText("");
      loadPortfolioData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleAddReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    try {
      await API.post(`/portfolio/${portfolio._id}/comment/${commentId}/reply`, { text });
      setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
      loadPortfolioData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add reply");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container">
          <h2>Loading Portfolio...</h2>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </>
    );
  }

  if (!portfolio) {
    return (
      <>
        <Header />
        <div className="container">
          <h2>No Portfolio Found</h2>
          <p>Create your portfolio first in the dashboard.</p>
          <button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="portfolio-container">
        <div className="portfolio-nav" data-html2canvas-ignore="true">
          <button onClick={() => navigate("/dashboard")}>← Back to Edit</button>
          <button onClick={downloadPDF} className="btn-download-pdf" disabled={exporting}>
            {exporting ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>

        <div className="profile-section">
          <img
            src={portfolio.profileImage || "https://via.placeholder.com/150"}
            alt="profile"
            className="profile-image"
          />
          <h1>{portfolio.fullName}</h1>
          <h2 className="title">{portfolio.title}</h2>
        </div>

        {portfolio.about && (
          <div className="section">
            <h3>About Me</h3>
            <p>{portfolio.about}</p>
          </div>
        )}

        {portfolio.skills && portfolio.skills.length > 0 && (
          <div className="section">
            <h3>Skills</h3>
            <ul id="skillsList">
              {portfolio.skills.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.education && portfolio.education.length > 0 && (
          <div className="section">
            <h3>Education</h3>
            {portfolio.education.map((edu, i) => (
              <div key={i} className="section-item">
                <h4>{edu.college}</h4>
                <p className="degree">{edu.degree}</p>
                <p className="year">{edu.year}</p>
              </div>
            ))}
          </div>
        )}

        {portfolio.projects && portfolio.projects.length > 0 && (
          <div className="section">
            <h3>Projects</h3>
            {portfolio.projects.map((project, i) => (
              <div key={i} className="section-item">
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                <div className="links">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  )}
                  {project.liveLink && (
                    <a href={project.liveLink} target="_blank" rel="noopener noreferrer">
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {portfolio.experience && portfolio.experience.length > 0 && (
          <div className="section">
            <h3>Experience</h3>
            {portfolio.experience.map((exp, i) => (
              <div key={i} className="section-item">
                <h4>{exp.company}</h4>
                <p className="role">{exp.role}</p>
                <p className="years">{exp.years}</p>
              </div>
            ))}
          </div>
        )}

        {portfolio.socialLinks &&
          (portfolio.socialLinks.github ||
            portfolio.socialLinks.linkedin ||
            portfolio.socialLinks.instagram) && (
            <div className="section">
              <h3>Connect With Me</h3>
              <div className="social-links">
                {portfolio.socialLinks.github && (
                  <a
                    href={portfolio.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                )}
                {portfolio.socialLinks.linkedin && (
                  <a
                    href={portfolio.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                )}
                {portfolio.socialLinks.instagram && (
                  <a
                    href={portfolio.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}

        <div className="section" data-html2canvas-ignore="true" style={{ marginTop: '40px', borderTop: '2px solid var(--card-border)', paddingTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Social Interactions</h3>
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid var(--secondary-border)',
                background: 'var(--secondary-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={portfolio.likes && portfolio.likes.includes(JSON.parse(localStorage.getItem("user") || "{}").id || "") ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-color)' }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              Like ({portfolio.likes ? portfolio.likes.length : 0})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '700' }}>Comments ({portfolio.comments ? portfolio.comments.length : 0})</h4>
            {portfolio.comments && portfolio.comments.length > 0 ? (
              portfolio.comments.map((comment) => (
                <div key={comment._id} style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--accent-color)', fontSize: '14px' }}>{comment.userName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>{comment.text}</p>

                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid var(--accent-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {comment.replies.map((reply) => (
                        <div key={reply._id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>{reply.userName}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyTexts[comment._id] || ""}
                      onChange={(e) => setReplyTexts((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                      style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', flex: 1 }}
                    />
                    <button
                      onClick={() => handleAddReply(comment._id)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', width: 'auto' }}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No comments yet. Be the first to comment!</p>
            )}
          </div>

          <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ minHeight: '80px', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
              required
            />
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 24px', width: 'auto' }}>
              Post Comment
            </button>
          </form>
        </div>

        <footer className="portfolio-footer">
          <p>© 2026 Created with Portfolio Generator</p>
        </footer>
      </div>
    </>
  );
}

export default Portfolio;

// Download utilities: text copy, DOCX (via docx), and text-based PDF (via jsPDF).
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
export async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
}
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function resumeToPlainText(r) {
    const lines = [];
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(r.professionalSummary);
    lines.push('');
    if (r.skills.length) {
        lines.push('SKILLS');
        lines.push(r.skills.join(', '));
        lines.push('');
    }
    if (r.experience.length) {
        lines.push('EXPERIENCE');
        for (const e of r.experience) {
            lines.push(`${e.title} | ${e.company} | ${e.dates}`);
            for (const b of e.bullets)
                lines.push(`- ${b}`);
            lines.push('');
        }
    }
    if (r.projects.length) {
        lines.push('PROJECTS');
        for (const p of r.projects) {
            lines.push(`${p.name}`);
            lines.push(p.description);
            lines.push('');
        }
    }
    if (r.education.length) {
        lines.push('EDUCATION');
        for (const ed of r.education)
            lines.push(ed);
        lines.push('');
    }
    if (r.certifications.length) {
        lines.push('CERTIFICATIONS');
        for (const c of r.certifications)
            lines.push(c);
        lines.push('');
    }
    return lines.join('\n').trim();
}
export async function downloadResumeDocx(r, filename = 'tailored-resume.docx') {
    const children = [];
    children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tailored Resume', bold: true, size: 32 })],
    }));
    children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Professional Summary', bold: true, size: 24 })],
    }));
    children.push(new Paragraph({ children: [new TextRun(r.professionalSummary)] }));
    children.push(new Paragraph({ children: [new TextRun('')] }));
    if (r.skills.length) {
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Skills', bold: true, size: 24 })],
        }));
        children.push(new Paragraph({ children: [new TextRun(r.skills.join(', '))] }));
        children.push(new Paragraph({ children: [new TextRun('')] }));
    }
    if (r.experience.length) {
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Experience', bold: true, size: 24 })],
        }));
        for (const e of r.experience) {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${e.title} | ${e.company} | ${e.dates}`, bold: true })],
            }));
            for (const b of e.bullets) {
                children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(b)] }));
            }
            children.push(new Paragraph({ children: [new TextRun('')] }));
        }
    }
    if (r.projects.length) {
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Projects', bold: true, size: 24 })],
        }));
        for (const p of r.projects) {
            children.push(new Paragraph({ children: [new TextRun({ text: p.name, bold: true })] }));
            children.push(new Paragraph({ children: [new TextRun(p.description)] }));
        }
        children.push(new Paragraph({ children: [new TextRun('')] }));
    }
    if (r.education.length) {
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Education', bold: true, size: 24 })],
        }));
        for (const ed of r.education)
            children.push(new Paragraph({ children: [new TextRun(ed)] }));
        children.push(new Paragraph({ children: [new TextRun('')] }));
    }
    if (r.certifications.length) {
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Certifications', bold: true, size: 24 })],
        }));
        for (const c of r.certifications)
            children.push(new Paragraph({ children: [new TextRun(c)] }));
    }
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, filename);
}
export function downloadResumePdf(r, filename = 'tailored-resume.pdf') {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;
    const ensure = (needed) => {
        if (y + needed > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };
    const heading = (text) => {
        ensure(28);
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(17, 32, 58);
        doc.text(text, margin, y);
        y += 14;
        doc.setDrawColor(210, 230, 241);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
    };
    const paragraph = (text, { bold = false, size = 10 } = {}) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(34, 40, 50);
        const wrapped = doc.splitTextToSize(text, maxWidth);
        for (const line of wrapped) {
            ensure(size + 4);
            doc.text(line, margin, y);
            y += size + 4;
        }
    };
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(17, 32, 58);
    doc.text('Tailored Resume', pageWidth / 2, y, { align: 'center' });
    y += 24;
    heading('Professional Summary');
    paragraph(r.professionalSummary);
    if (r.skills.length) {
        heading('Skills');
        paragraph(r.skills.join(', '));
    }
    if (r.experience.length) {
        heading('Experience');
        for (const e of r.experience) {
            paragraph(`${e.title} | ${e.company} | ${e.dates}`, { bold: true, size: 11 });
            for (const b of e.bullets)
                paragraph(`• ${b}`);
            y += 4;
        }
    }
    if (r.projects.length) {
        heading('Projects');
        for (const p of r.projects) {
            paragraph(p.name, { bold: true });
            paragraph(p.description);
        }
    }
    if (r.education.length) {
        heading('Education');
        for (const ed of r.education)
            paragraph(ed);
    }
    if (r.certifications.length) {
        heading('Certifications');
        for (const c of r.certifications)
            paragraph(c);
    }
    doc.save(filename);
}
export function downloadTextPdf(title, body, filename) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(17, 32, 58);
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(34, 40, 50);
    const paragraphs = body.split('\n');
    for (const p of paragraphs) {
        const wrapped = doc.splitTextToSize(p, maxWidth);
        for (const line of wrapped) {
            if (y > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 13;
        }
        y += 4;
    }
    doc.save(filename);
}
export function reportToText(report) {
    const lines = [];
    lines.push('InterviewReady AI - Final Report');
    lines.push(`Answered: ${report.answeredCount} | Skipped: ${report.skippedCount}`);
    if(report.incomplete)lines.push('Incomplete session - '+(report.unansweredCount||0)+' questions not attempted.');
    lines.push('');
    lines.push('Strongest areas:');
    for (const s of report.strongestAreas)
        lines.push(`- ${s}`);
    lines.push('');
    lines.push('Improvement areas:');
    for (const s of report.improvementAreas)
        lines.push(`- ${s}`);
    lines.push('');
    lines.push('Topics to study:');
    for (const s of report.topicsToStudy)
        lines.push(`- ${s}`);
    lines.push('');
    lines.push('Practice plan:');
    for (const p of report.practicePlan)
        lines.push(`- ${p.day}: ${p.activity} (${p.focus})`);
    lines.push('');
    lines.push('Per-question feedback:');
    for (const q of report.perQuestion) {
        lines.push(`Q: ${q.question}`);
        lines.push(`Category: ${q.category} | ${q.skipped ? 'Skipped' : 'Answered'}`);
        if (q.ratings?.length) {
            lines.push('Ratings:');
            for (const r of q.ratings)
                lines.push(`  - ${r.dimension}: ${r.score}/5 - ${r.rationale}`);
        }
        lines.push(`Summary: ${q.feedbackSummary}`);
        lines.push('');
    }
    lines.push(report.overallNote);
    return lines.join('\n');
}

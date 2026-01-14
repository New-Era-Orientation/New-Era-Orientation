import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Row,
    Column,
    Hr,
} from "@react-email/components";

interface WeeklyDigestProps {
    userName: string;
    weekStartDate: string;
    weekEndDate: string;
    stats: {
        examsCompleted: number;
        avgScore: number;
        studyTime: number;
        flashcardsReviewed: number;
        streakDays: number;
    };
    topScores: {
        examTitle: string;
        score: number;
        date: string;
    }[];
    weakAreas: {
        topic: string;
        accuracy: number;
    }[];
    achievements: {
        name: string;
        icon: string;
    }[];
    recommendations: string[];
}

export function WeeklyDigestEmail({
    userName,
    weekStartDate,
    weekEndDate,
    stats,
    topScores,
    weakAreas,
    achievements,
    recommendations,
}: WeeklyDigestProps) {
    return (
        <Html>
            <Head />
            <Preview>📊 Báo cáo học tập tuần {weekStartDate} - {weekEndDate}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={headerSection}>
                        <Text style={logo}>NEO-EDU</Text>
                        <Heading style={heading}>📊 Báo cáo học tập tuần</Heading>
                        <Text style={dateRange}>{weekStartDate} - {weekEndDate}</Text>
                    </Section>

                    {/* Greeting */}
                    <Section style={section}>
                        <Text style={greeting}>Xin chào {userName}! 👋</Text>
                        <Text style={paragraph}>
                            Đây là tổng kết hoạt động học tập của bạn trong tuần qua. 
                            Cùng xem bạn đã tiến bộ như thế nào nhé!
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    {/* Stats Overview */}
                    <Section style={section}>
                        <Heading as="h2" style={sectionHeading}>📈 Tổng quan</Heading>
                        <Row>
                            <Column style={statBox}>
                                <Text style={statNumber}>{stats.examsCompleted}</Text>
                                <Text style={statLabel}>Bài thi</Text>
                            </Column>
                            <Column style={statBox}>
                                <Text style={statNumber}>{stats.avgScore.toFixed(1)}</Text>
                                <Text style={statLabel}>Điểm TB</Text>
                            </Column>
                            <Column style={statBox}>
                                <Text style={statNumber}>{Math.round(stats.studyTime / 60)}h</Text>
                                <Text style={statLabel}>Thời gian</Text>
                            </Column>
                            <Column style={statBox}>
                                <Text style={statNumber}>{stats.streakDays}🔥</Text>
                                <Text style={statLabel}>Streak</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Top Scores */}
                    {topScores.length > 0 && (
                        <Section style={section}>
                            <Heading as="h2" style={sectionHeading}>🏆 Điểm cao nhất</Heading>
                            {topScores.slice(0, 3).map((score, i) => (
                                <Row key={i} style={listItem}>
                                    <Column style={{ width: "30px" }}>
                                        <Text style={rankBadge}>#{i + 1}</Text>
                                    </Column>
                                    <Column>
                                        <Text style={examTitle}>{score.examTitle}</Text>
                                        <Text style={examMeta}>{score.date}</Text>
                                    </Column>
                                    <Column style={{ textAlign: "right" as const }}>
                                        <Text style={scoreText}>{score.score} điểm</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* Weak Areas */}
                    {weakAreas.length > 0 && (
                        <Section style={section}>
                            <Heading as="h2" style={sectionHeading}>📚 Cần cải thiện</Heading>
                            <Text style={paragraph}>
                                Những chủ đề bạn cần luyện tập thêm:
                            </Text>
                            {weakAreas.slice(0, 3).map((area, i) => (
                                <Row key={i} style={weakAreaItem}>
                                    <Column>
                                        <Text style={weakAreaTopic}>{area.topic}</Text>
                                    </Column>
                                    <Column style={{ textAlign: "right" as const }}>
                                        <Text style={accuracyText}>{area.accuracy}% chính xác</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* Achievements */}
                    {achievements.length > 0 && (
                        <Section style={section}>
                            <Heading as="h2" style={sectionHeading}>🎉 Thành tựu mới</Heading>
                            <Row>
                                {achievements.slice(0, 4).map((achievement, i) => (
                                    <Column key={i} style={achievementBox}>
                                        <Text style={achievementIcon}>{achievement.icon}</Text>
                                        <Text style={achievementName}>{achievement.name}</Text>
                                    </Column>
                                ))}
                            </Row>
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* Recommendations */}
                    <Section style={section}>
                        <Heading as="h2" style={sectionHeading}>💡 Gợi ý tuần này</Heading>
                        {recommendations.slice(0, 3).map((rec, i) => (
                            <Text key={i} style={recommendationItem}>
                                ✓ {rec}
                            </Text>
                        ))}
                    </Section>

                    <Hr style={divider} />

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Link href="https://neo-edu.vercel.app/dashboard" style={ctaButton}>
                            Tiếp tục học tập 🚀
                        </Link>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Email này được gửi tự động hàng tuần.
                            <br />
                            <Link href="https://neo-edu.vercel.app/settings" style={footerLink}>
                                Quản lý cài đặt email
                            </Link>
                        </Text>
                        <Text style={copyright}>
                            © 2026 NEO-EDU. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    maxWidth: "600px",
};

const headerSection = {
    padding: "24px",
    textAlign: "center" as const,
    backgroundColor: "#1a1a2e",
    color: "#ffffff",
};

const logo = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#00d9ff",
    margin: "0 0 16px 0",
};

const heading = {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#ffffff",
    margin: "0 0 8px 0",
};

const dateRange = {
    fontSize: "14px",
    color: "#a0a0a0",
    margin: "0",
};

const section = {
    padding: "24px",
};

const greeting = {
    fontSize: "20px",
    fontWeight: "600" as const,
    color: "#1a1a2e",
    margin: "0 0 12px 0",
};

const paragraph = {
    fontSize: "14px",
    color: "#666666",
    lineHeight: "1.6",
    margin: "0",
};

const sectionHeading = {
    fontSize: "18px",
    fontWeight: "600" as const,
    color: "#1a1a2e",
    margin: "0 0 16px 0",
};

const statBox = {
    textAlign: "center" as const,
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
};

const statNumber = {
    fontSize: "28px",
    fontWeight: "bold" as const,
    color: "#1a1a2e",
    margin: "0",
};

const statLabel = {
    fontSize: "12px",
    color: "#666666",
    margin: "4px 0 0 0",
};

const listItem = {
    padding: "12px 0",
    borderBottom: "1px solid #eee",
};

const rankBadge = {
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "#00d9ff",
    margin: "0",
};

const examTitle = {
    fontSize: "14px",
    fontWeight: "500" as const,
    color: "#1a1a2e",
    margin: "0",
};

const examMeta = {
    fontSize: "12px",
    color: "#999999",
    margin: "2px 0 0 0",
};

const scoreText = {
    fontSize: "16px",
    fontWeight: "bold" as const,
    color: "#22c55e",
    margin: "0",
};

const weakAreaItem = {
    padding: "8px 12px",
    backgroundColor: "#fff7ed",
    borderRadius: "6px",
    marginBottom: "8px",
};

const weakAreaTopic = {
    fontSize: "14px",
    color: "#1a1a2e",
    margin: "0",
};

const accuracyText = {
    fontSize: "14px",
    color: "#f97316",
    fontWeight: "500" as const,
    margin: "0",
};

const achievementBox = {
    textAlign: "center" as const,
    padding: "12px",
};

const achievementIcon = {
    fontSize: "32px",
    margin: "0 0 4px 0",
};

const achievementName = {
    fontSize: "11px",
    color: "#666666",
    margin: "0",
};

const recommendationItem = {
    fontSize: "14px",
    color: "#1a1a2e",
    padding: "8px 12px",
    backgroundColor: "#f0fdf4",
    borderRadius: "6px",
    marginBottom: "8px",
};

const ctaSection = {
    padding: "24px",
    textAlign: "center" as const,
};

const ctaButton = {
    backgroundColor: "#00d9ff",
    color: "#1a1a2e",
    padding: "14px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold" as const,
    fontSize: "16px",
    display: "inline-block",
};

const divider = {
    borderColor: "#eee",
    margin: "0",
};

const footer = {
    padding: "24px",
    textAlign: "center" as const,
};

const footerText = {
    fontSize: "12px",
    color: "#999999",
    margin: "0 0 12px 0",
};

const footerLink = {
    color: "#00d9ff",
    textDecoration: "underline",
};

const copyright = {
    fontSize: "11px",
    color: "#cccccc",
    margin: "0",
};

export default WeeklyDigestEmail;

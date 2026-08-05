import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }
  return transporter;
}

export class EmailService {
  static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p><a href="${resetUrl}">Cliquez ici pour définir un nouveau mot de passe</a> (valable 1 heure).</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `,
    });
  }

  static async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Bienvenue à la bibliothèque',
      html: `<p>Bonjour ${firstName},</p><p>Votre compte a été créé avec succès.</p>`,
    });
  }

  static async sendMemberWelcomeEmail(
    to: string,
    firstName: string,
    matricule: string,
    temporaryPassword: string
  ): Promise<void> {
    await this.send({
      to,
      subject: 'Bienvenue à la bibliothèque — vos identifiants',
      html: `
        <p>Bonjour ${firstName},</p>
        <p>Votre carte d'adhérent <strong>${matricule}</strong> a été créée.</p>
        <p>Identifiants de connexion :</p>
        <ul>
          <li>Email : ${to}</li>
          <li>Mot de passe temporaire : <strong>${temporaryPassword}</strong></li>
        </ul>
        <p>Merci de changer ce mot de passe dès votre première connexion.</p>
      `,
    });
  }

  static async sendAccountLockedEmail(to: string): Promise<void> {
    await this.send({
      to,
      subject: 'Alerte de sécurité : compte verrouillé',
      html: `<p>Votre compte a été temporairement verrouillé suite à plusieurs tentatives de connexion échouées.</p>`,
    });
  }

  static async sendReservationAvailableEmail(to: string, firstName: string, expiryHours: number): Promise<void> {
    await this.send({
      to,
      subject: 'Votre réservation est disponible',
      html: `
        <p>Bonjour ${firstName},</p>
        <p>Le livre que vous avez réservé est disponible à la bibliothèque.</p>
        <p>Merci de venir le récupérer sous ${expiryHours} heures, faute de quoi votre réservation sera proposée à l'adhérent suivant.</p>
      `,
    });
  }

  static async sendOverdueReminderEmail(to: string, firstName: string, bookTitle: string, daysLate: number): Promise<void> {
    await this.send({
      to,
      subject: 'Rappel : retour de livre en retard',
      html: `
        <p>Bonjour ${firstName},</p>
        <p>Le livre <strong>${bookTitle}</strong> que vous avez emprunté est en retard de ${daysLate} jour(s).</p>
        <p>Merci de le retourner dès que possible afin de limiter les frais de retard.</p>
      `,
    });
  }

  private static async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    try {
      if (!env.smtp.host) {
        logger.warn(`[EmailService] SMTP non configuré — email simulé vers ${opts.to}: "${opts.subject}"`);
        return;
      }
      await getTransporter().sendMail({ from: env.smtp.from, ...opts });
    } catch (error) {
      // Un échec d'envoi d'email ne doit jamais faire planter le flux métier (ex: inscription).
      logger.error('[EmailService] Échec d’envoi d’email', error);
    }
  }
}

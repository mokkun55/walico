import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "プライバシーポリシー - Walico",
  description: "Walicoのプライバシーポリシー",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">プライバシーポリシー</h1>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        <div className="prose prose-sm max-w-none">
          <div className="space-y-8 text-gray-700">
            {/* 前文 */}
            <section>
              <p className="text-sm leading-relaxed">
                Walico（以下「当サービス」）は、ユーザーの個人情報の保護に関し、個人情報の保護に関する法律（個人情報保護法）その他の関連法令を遵守し、適切な取り扱いを行います。本プライバシーポリシーは、当サービスが取得する個人情報の取り扱いについて説明するものです。
              </p>
            </section>

            {/* 1. 取得する個人情報 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">1. 取得する個人情報</h2>
              <p className="text-sm leading-relaxed mb-3">
                当サービスでは、以下の個人情報を取得する場合があります。
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed ml-4">
                <li>
                  <strong>メールアドレス：</strong>
                  ユーザー認証およびアカウント管理の目的で取得いたします。LINEログイン機能を使用する場合、LINEアカウントに紐づくメールアドレスを取得する場合があります。
                </li>
                <li>
                  <strong>プロフィール情報：</strong>
                  ユーザー名、プロフィール画像など、LINEアカウントから取得する情報
                </li>
                <li>
                  <strong>請求情報：</strong>
                  サービス利用に伴い入力いただく、店名、金額、日時などの請求に関連する情報
                </li>
                <li>
                  <strong>レシート画像：</strong>
                  サービス提供のため一時的に保存する画像データ
                </li>
              </ul>
            </section>

            {/* 2. 個人情報の利用目的 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">2. 個人情報の利用目的</h2>
              <p className="text-sm leading-relaxed mb-3">
                当サービスは、取得した個人情報を以下の目的で利用いたします。
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed ml-4">
                <li>ユーザー認証およびアカウント管理</li>
                <li>請求履歴の管理および表示</li>
                <li>サービス品質の向上および新機能の開発</li>
                <li>不正利用の防止およびセキュリティの維持</li>
                <li>ユーザーへの重要なお知らせの送信（メールアドレスを使用）</li>
                <li>カスタマーサポートの提供</li>
              </ul>
            </section>

            {/* 3. メールアドレスの取得・利用について */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">3. メールアドレスの取得・利用について</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
                <p className="text-sm font-semibold text-emerald-800 mb-2">
                  重要：メールアドレスの取得について
                </p>
                <p className="text-sm leading-relaxed text-emerald-700">
                  当サービスでは、ユーザー認証およびアカウント管理、ならびにサービスに関する重要なお知らせを送信する目的で、メールアドレスを取得・利用いたします。メールアドレスの取得は、ユーザーがLINEログイン機能を使用する際に、LINEアカウントに紐づくメールアドレスを自動的に取得する場合があります。
                </p>
              </div>
              <p className="text-sm leading-relaxed mb-3">
                メールアドレスの利用目的は以下のとおりです：
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed ml-4">
                <li>アカウントの認証および本人確認</li>
                <li>パスワードリセットなどのアカウント管理機能の提供</li>
                <li>サービスに関する重要なお知らせの送信（サービス利用規約の変更、セキュリティに関する通知など）</li>
                <li>不正利用の検知および防止</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3">
                メールアドレスは、上記の目的以外には使用いたしません。また、第三者が識別可能な形でメールアドレスを公表することはありません。
              </p>
            </section>

            {/* 4. 個人情報の第三者提供 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">4. 個人情報の第三者提供</h2>
              <p className="text-sm leading-relaxed">
                当サービスは、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed ml-4 mt-3">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関等への協力が必要な場合</li>
              </ul>
            </section>

            {/* 5. 個人情報の管理 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">5. 個人情報の管理</h2>
              <p className="text-sm leading-relaxed">
                当サービスは、個人情報の正確性を保ち、これを安全に管理するため、セキュリティシステムの維持・管理体制の整備・社員教育の徹底等の必要な措置を講じ、個人情報の漏えい、紛失または毀損の防止その他個人情報の安全管理のために必要かつ適切な措置を講じます。
              </p>
            </section>

            {/* 6. 個人情報の保存期間 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">6. 個人情報の保存期間</h2>
              <p className="text-sm leading-relaxed">
                当サービスは、個人情報を利用目的の達成に必要な期間に限り保存いたします。レシート画像等の一時的なデータについては、一定期間後に自動的に削除されます。
              </p>
            </section>

            {/* 7. ユーザーの権利 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">7. ユーザーの権利</h2>
              <p className="text-sm leading-relaxed mb-3">
                ユーザーは、当サービスに対して、自己の個人情報について、以下の権利を有します。
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed ml-4">
                <li>個人情報の開示を求める権利</li>
                <li>個人情報の訂正、追加または削除を求める権利</li>
                <li>個人情報の利用停止または消去を求める権利</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3">
                上記の権利を行使される場合は、お問い合わせフォームまたはサービス内の設定からご連絡ください。
              </p>
            </section>

            {/* 8. Cookie・アクセスログについて */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">8. Cookie・アクセスログについて</h2>
              <p className="text-sm leading-relaxed">
                当サービスでは、サービス提供のため、Cookieやアクセスログを使用する場合があります。これらは個人を特定する情報を含まない統計的な情報として利用されます。
              </p>
            </section>

            {/* 9. プライバシーポリシーの変更 */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">9. プライバシーポリシーの変更</h2>
              <p className="text-sm leading-relaxed">
                当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。重要な変更がある場合は、メールアドレスまたはサービス内で通知いたします。
              </p>
            </section>

            {/* 10. お問い合わせ */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-3">10. お問い合わせ</h2>
              <p className="text-sm leading-relaxed">
                個人情報の取り扱いに関するお問い合わせ、苦情、ご意見等は、サービス内のお問い合わせフォームよりご連絡ください。
              </p>
            </section>

            {/* 最終更新日 */}
            <section className="pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                最終更新日：2025年1月
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

